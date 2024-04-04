/** 
 * The main class
 * @module
 */

// import "./shimSet.mjs";
import { FetchError } from "./custom-errors.mjs";

import type { Dirent } from "node:fs";

import chalk from "chalk";
import { closest } from "fastest-levenshtein";
import fsp from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import tar from "tar";
import { request } from "undici";
// import path from "node:path";
import pathe from "pathe";


export type Typo = [original: string, correction: string];

export interface ListItem { 
    filePath: string; 
    conflict: boolean; 
}

export interface GithubExtractorOptions {
    /**
     * E.g. "octocat" in https://github.com/octocat/Spoon-Knife                 
     */
    owner: string; 
    /**
     * E.g. "Spoon-Knife" in https://github.com/octocat/Spoon-Knife                 
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

export interface ListStreamOptions {
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
     * A prefix to add to output. Default is nothing.
     */
    prefix?: string;
    /**
     * Suffix to add to the output. Defaults to a new line
     */
    suffix?: string;
}

export interface ListOptions {
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
    /**
     * Must match every regular expression if given.
     */
    match?: RegExp;
}

export interface DownloadToOptions {
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
     * Must match every regular expression if given. If {@link selectedPaths} is given, it 
     * will operate on selected only.
     */
    match?: RegExp;
    /**
     * Pass through options for the tar.extract stream. Not very important
     *  but here for completeness.
     */
    extractOptions?: Omit<tar.ExtractOptions, "filter" | "cwd" | "strip" | "onentry" | "C">;
    /**
     * Callback for when a file is written. Useful for logging or other operations.
     */
    onFileWritten?: (entry: tar.ReadEntry) => void;
}


/**
 * The main class
 */
export class GithubExtractor {

    public caseInsensitive: GithubExtractorOptions["caseInsensitive"];

    public owner: GithubExtractorOptions["owner"];
    public repo: GithubExtractorOptions["repo"];

    protected debug: boolean = false;
    private requestFn: typeof request = request;
    
    /**
     * @param options - Main class constructor options.
     */
    constructor(
        { owner, repo, caseInsensitive }: GithubExtractorOptions
    ) {
        this.owner = owner;
        this.repo = repo;
        this.caseInsensitive = caseInsensitive ?? false;
    }
    
    protected normalizeTarPath(tarPath: string) {
        // Remove everything before the first "/" to remove the repo name:
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

            throw new FetchError("Rate limit exceeded" + (wait ? `Please wait ${ wait } minutes` : ""));
        }

        throw new FetchError(`Bad response from github. StatusCode: ${ res.statusCode }. ` + (this.debug ? `Url: ${ res.url }\nHeaders:\n${ JSON.stringify(res.headers, null, 2) },\nBody:\n${ (await res.body.text()).slice(0, 2000) }` : ""));
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
            throw new FetchError(`Error getting repo '${ this.owner }/${ this.repo }': ${ error?.message }`);
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
     * @param options
     * 
     * @returns - An empty array if all `selectedPaths` were found / there were no `selectedPaths`
     *  given OR an array of possible typos if some of the `selectedPaths` were not found.
     * 
     * @example
     * 
     * Basic usage:
     * ```typescript
     * await ghe.downloadTo({ dest: "some/path" });
     * ```
     * To only download some paths: \
     * Do not prefix path with repo name. It will stop downloading once it has the file 
     * (this can make getting a single file from a large repo very fast).
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
        { dest, selectedPaths, extractOptions, match, onFileWritten }: DownloadToOptions
    ) {
        const selectedSet = selectedPaths?.length ? 
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
                        
                        fPath = this.normalizeTarPath(fPath);
                        
                        if (!fPath) return false;
                        internalList.push(fPath);

                        if (selectedSet && !selectedSet.has(fPath)) {
                            return false;
                        }
                        selectedSet?.delete(fPath);

                        if (match && !match.test(fPath)) { 
                            return false;
                        }
                        return true;
                    },
                    onentry: (entry) => {
                        entry.on("end", () => {
                            if (onFileWritten) onFileWritten(entry);
                            if (selectedSet?.size === 0) {
                                controller.abort("finished");
                            }
                        });
                    },
                })
            );
        }
        
        catch (error) {
            // Istnanbul erroneously doesn't pick up test (see: GithubExtractor.online.test.mts)
            if (controller?.signal?.aborted) {
                // pass
            }
            else {
                throw error;
            }
        }
        finally {
            body.destroy();
        }

        return selectedSet?.size ? this.handleTypos({ pathList: internalList, selectedSet }) : [];
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

        let dirEnts: Dirent[];

        try {
            dirEnts = await fsp.readdir(dir, { withFileTypes: true, recursive });
        }
        catch (error) {
            if (error instanceof Error && "code" in error && error.code === "ENOENT") {
                throw new Error(`Directory ${ dir } does not exist.`);
            }
            throw error;
        }

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
                outputStream = process.stdout, highlightConflicts = true, prefix = "", suffix = "\n",
            }, 
        }: 
        { listItem: ListItem; streamOptions: ListStreamOptions }
    ) {

        const listString = listItem.conflict && highlightConflicts ?
            CONFLICT_COLOR(listItem.filePath) :
            listItem.filePath;

        outputStream.write(prefix + listString + suffix);
    }

    /**
     * Returns a list of files in the repo and writes to (by default) stdout (console.log). Supply
     * an object with options to change defaults.
     * 
     * @param options
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
        { dest, conflictsOnly = false, recursive = true, streamOptions = {}, match }: ListOptions = {}
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
            path = this.normalizeTarPath(path);

            if (match && !match.test(path)) {
                return false;
            }
            // path.slice(1, -1): removes "/" from start and end. Now if there's 
            // two or more members after the split, we know it's nested.
            return recursive || path.slice(1, -1).split("/").length < 2;
        };

        const { body } = await this.getTarBody();

        await pipeline(body, tar.list({ onentry: handleEntry, filter }));

        return repoList;
    }
}
