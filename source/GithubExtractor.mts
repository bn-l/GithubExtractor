// import "./shimSet.mjs";
import { APIFetchError } from "./custom-errors.mjs";

import chalk from "chalk";
import { closest } from "fastest-levenshtein";
import fsp from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import tar from "tar";
import { request } from "undici";
// import path from "node:path";
import pathe from "pathe";


type Typo = [original: string, correction: string];

type ListItem = { filePath: string; conflict: boolean };


interface GithubExtractorOptions {
    /**
     * "octocat" in https://github.com/octocat/Spoon-Knife                 
     */
    owner: string; 
    /**
     * "Spoon-Knife" in https://github.com/octocat/Spoon-Knife                 
     */
    repo: string; 
    /**
     * Whether to ignore casing in paths. Default is false so SomePath/someFile.js will be
     * different to SOMEPATH/somefile.js.
     * @default false
     */
    caseInsensitive?: boolean; 
}

const CONFLICT_COLOR = chalk.hex("#d20f39");

interface ListStreamOptions {
    /**
     * The stream to write the repo paths to for visual output as the list is being created.
     *  by default it will write to the console.
     * @default process.stdout
     */
    outputStream?: NodeJS.WritableStream;
    /**
     * Whether to use ascii escape characters to highlight conflicts when writing to the
     *  outputStream.
     * @default true
     */
    highlightConflicts?: boolean;
    /**
     * Include new line at the end of each listed repo path.
     * @default true
     */
    newLine?: boolean;
}

interface ListOptions {
    /**
     * The destination directory for the repo's files. Used to detect conflicts
     * and must be set if any conflict option is set.
     */
    dest?: string; 
    /**
     * Only list repo files in conflict with dest
     * @default false
     */
    conflictsOnly?: boolean; 
    /**
     * If false will only list files and folders in the top level. Useful for repos with many files.
     * @default true
     */
    recursive?: boolean;
    /**
     * Options for the stream to write the repo paths to for visual output as the list is being created. By default it writes to the console.
     */
    streamOptions?: ListStreamOptions;
}

interface DownloadToOptions {
    /**
     * Destination to download the files into. Warning: it will overwrite any existing files 
     * by default unless extractOptions are set.
     */
    dest: string; 
    /**
     * Will only download these paths.
     * @example
     * ["README.md", ".github/workflows/ci.yml"]
     */
    selectedPaths?: string[];
    /**
     * Include everything matching the regular expression. To exclude use negated regex.
     */
    include?: RegExp;
    /**
     * Pass through options for the tar.extract stream.
     */
    extractOptions?: Omit<tar.ExtractOptions, "filter" | "cwd" | "strip" | "onentry" | "C">;
}

export class GithubExtractor {

    public caseInsensitive: GithubExtractorOptions["caseInsensitive"];
    public debug: boolean = false;
    public owner: GithubExtractorOptions["owner"];
    public repo: GithubExtractorOptions["repo"];
    
    protected requestFn: typeof request = request;
    

    constructor(
        { owner, repo, caseInsensitive }: GithubExtractorOptions
    ) {
        this.owner = owner;
        this.repo = repo;
        this.caseInsensitive = caseInsensitive ?? false;
    }
    
    protected normalizeTarPath(tarPath: string) {
        // slice off everything after the "/":
        //   someprefixdir/somefile.txt -> somefile.txt
        return this.caseInsensitive ? 
            tarPath.slice(tarPath.indexOf("/") + 1).toLowerCase().trim() :
            tarPath.slice(tarPath.indexOf("/") + 1).trim();
    }

    protected normalizeFilePath(filePath: string) {
        return this.caseInsensitive ? filePath.toLowerCase().trim() : filePath.trim();
    }

    protected normalizePathSet(filePathSet: Set<string>) {

        const values = Array.from(filePathSet.values());
        const normalized = values.map(filePath => this.normalizeFilePath(filePath));
        return new Set(normalized);
    }


    protected async handleBadResponseCode(res: Awaited<ReturnType<typeof this.makeRequest>>): Promise<never> {

        const { "x-ratelimit-remaining": remaining, "x-ratelimit-reset": resetIn } = res.headers;

        if (Number(remaining) === 0) {
            const resetInDateNum = new Date(Number(resetIn)).getTime();

            const wait = Number.isInteger(resetInDateNum) ? 
                Math.ceil((resetInDateNum * 1000) - (Date.now() / 1000 / 60)) :
                undefined;

            throw new APIFetchError("Rate limit exceeded" + (wait ? `Please wait ${ wait } minutes` : ""));
        }

        throw new APIFetchError(`Error getting response from github StatusCode: ${ res.statusCode }. ` + (this.debug ? `Url: ${ res.url }\nHeaders:\n${ JSON.stringify(res.headers, null, 2) },\nBody:\n${ (await res.body.text()).slice(0, 2000) }` : ""));
    }

    protected async makeRequest(url: string) {

        const controller = new AbortController();
        
        try {
            const { statusCode, headers, body } = await this.requestFn(url, {
                signal: controller.signal,
                maxRedirections: 5, 
                headers: {
                    // "cache-control": "no-cache",
                    // "pragma": "no-cache",
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                },
            });

            if (statusCode !== 200) await this.handleBadResponseCode({ statusCode, headers, body, controller, url });

            return { statusCode, headers, body, controller, url };
        }
        catch (error) {
            // @ts-expect-error no guard
            throw new APIFetchError(`Error getting ${ this.owner }/${ this.repo } from github: ${ error?.message }`);
        }
    }


    protected async getTarBody() {
        // "Codeload" is the non api endpoint you download repo archives from on github
        // Here, if the default branch is "main", (firstTry) the codeload link will work.
        // If it's anything else, the second link will redirect to the right codeload.
        // (saves a tiny amount of waiting, reduces load a bit on github.com).

        // https://stackoverflow.com/questions/60188254/how-is-codeload-github-com-different-to-api-github-com

        const firstTry = `https://codeload.github.com/${ this.owner }/${ this.repo }/tar.gz/main`;
        const secondTry = `https://github.com/${ this.owner }/${ this.repo }/archive/refs/heads/master.tar.gz`;

        try { 
            return await this.makeRequest(firstTry); 
        }
        catch { 
            return await this.makeRequest(secondTry);
        }

    }


    protected handleTypos(
        { pathList, selectedSet }:
        { pathList: string[]; selectedSet: Set<string> }
    ): Typo[] {

        const typos: Typo[] = [];
        for (const original of selectedSet.values()) {

            const correction = closest(original, pathList);
            typos.push([original, correction]);
        }
        return typos;
    }
    

    /**
     * Download a repo to a certain location (`dest`)
     * 
     * @returns - An empty array if all `selectedPaths` were found / there were no `selectedPaths`
     *  given OR an array of possible typos if some of the `selectedPaths` were not found.
     * 
     * @example 
     * ```typescript
     * await ghe.downloadTo({ dest: "some/path" });
     * ```
     * Using `selectedPaths`:
     * Downloads only the paths in the repo specified. Do not prefix with repo name. It will 
     * stop downloading once it has the file. This can make getting a single file from a large 
     * repo very fast.
     * 
     * ```typescript
     * // Save just `boo.jpg`:
     * await ghe.downloadTo({ dest: "some/path", selectedPaths: ["someFolder/boo.jpg"] });
     *
     * // just the `README.md` file: 
     * await ghe.downloadTo({ dest: "some/path", selectedPaths: ["README.md"] });
     *    
     * ```
     */
    public async downloadTo(
        { dest, selectedPaths, extractOptions, include }: DownloadToOptions
    ) {
        const selectedSet = selectedPaths ? 
            this.normalizePathSet(new Set(selectedPaths)) :
            undefined;

        const { body, controller } = await this.getTarBody();
        const internalList: string[] = [];

        await fsp.mkdir(dest, { recursive: true });

        try {
            await pipeline(
                body, 
                tar.extract({
                    ...extractOptions,
                    cwd: dest,
                    strip: 1,
                    filter: (fPath) => {
                        
                        if (include && !include.test(fPath)) return false;

                        fPath = this.normalizeTarPath(fPath);
                        
                        if (!fPath) return false;
                        internalList.push(fPath);

                        if (selectedSet && !selectedSet.has(fPath)) {
                            return false;
                        }
                        selectedSet?.delete(fPath);
                        return true;
                    },
                    onentry: (entry) => {
                        entry.on("end", () => {
                            if (selectedSet?.size === 0) {
                                controller.abort();
                            }
                        });
                    },
                })
            );

            // if we still haven't struck out all the paths, there might be typos
            return selectedSet?.size ? this.handleTypos({ pathList: internalList, selectedSet }) : [];
        } 
        finally {
            body.destroy();
        }
    }

    /**
     * Get a set of the contents of a directory, sorted using using string.localeCompare (with 
     * directories listed first).
     * all paths are converted to posix and are relative to the given dir.
     * @param dir
     * @param recursive - default true
     * @returns 
     */
    public async getLocalDirSet(dir: string, recursive = true): Promise<Set<string>> {

        const dirEnts = await fsp.readdir(dir, { withFileTypes: true, recursive });

        const processed: string[] = [];
        
        for (const ent of dirEnts) {
            const relPath = pathe.relative(dir, pathe.join(ent.path, ent.name));
            // const posixPath = path.posix.normalize(relPath.split(path.sep).join(path.posix.sep));
            
            let processedPath = ent.isDirectory() ? relPath + "/" : relPath;
            processedPath = this.normalizeFilePath(processedPath);
            processed.push(processedPath);
        }
        
        processed.sort((a, b) => {
            if (a.endsWith("/") && !b.endsWith("/")) {
                return -1;
            }
            if (!a.endsWith("/") && b.endsWith("/")) {
                return 1;
            }
            return a.localeCompare(b);
        });

        const dirSet = new Set(processed);
        return dirSet;
    }
   
    protected writeListStream(
        { listItem, 
            streamOptions: { 
                outputStream = process.stdout, highlightConflicts = true, newLine = true, 
            }, 
        }: 
        { listItem: ListItem; streamOptions: ListStreamOptions }
    ) {

        const listString = listItem.conflict && highlightConflicts ?
            CONFLICT_COLOR(listItem.filePath) :
            listItem.filePath;
        
        const endOfLineChar = newLine ? "\n" : "";

        outputStream.write(listString + endOfLineChar);
    }

    /**
     * Returns a list of files in the repo and writes to (by default) stdout (console.log). Supply
     * an object with options to change defaults.
     * 
     * @example
     * ```typescript
     * const fullList = await ghe.list();
     * 
     * // List a repo non recursively to only show the top-level items:
     * const topLevel = await ghe.list({ recursive: false }); 
     * 
     * // Show any conflicts that might arise if downloading to `dest`:
     * const conflicts = await ghe.list({ dest: "some/path", conflictsOnly: true });
     *    
     * ```
     */
    public async list(
        { dest, conflictsOnly = false, recursive = true, streamOptions = {} }: ListOptions = {}
    ): Promise<ListItem[]> {
        
        const repoList: ListItem[] = [];
        
        let destSet: Set<string> | undefined;
        if (dest) destSet = await this.getLocalDirSet(dest);

        const handleEntry = (entry: tar.ReadEntry) => {

            const filePath = this.normalizeTarPath(entry.path);
            if (!filePath) return; 

            const conflict = !!destSet?.has(filePath);
            const listItem: ListItem = { filePath, conflict };

            if (!conflictsOnly || conflict) {
                repoList.push(listItem);
                this.writeListStream({ listItem, streamOptions });
            }
        };

        const filter = (path: string) => {
            // Length <= 2 to account for pre normalization where the archive name isn't
            //  isn't removed. So anything with more than two parts in the path is not first level.
            // path.slice(1, -1): slice starting at 1 takes care of a "/" prefix,
            //  ending at -1 removes trailing "/". Now if there's two members in the 
            //  resulting array, we know it's a nested path
            return recursive || path.slice(1, -1).split("/").length <= 2;
        };

        const { body } = await this.getTarBody();

        await pipeline(body, tar.list({ onentry: handleEntry, filter }));

        return repoList;
    }
}
