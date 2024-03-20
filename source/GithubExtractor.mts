// import "./shimSet.mjs";
import { FileConflictError, MissingInJSONError, APIFetchError } from "./custom-errors.mjs";

import chalk from "chalk";
import fastlev from "fastest-levenshtein";
import fsp from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import tar from "tar";
import { request } from "undici";


const { closest } = fastlev;

type Typo = [original: string, correction: string];

type ListItem = { filePath: string; conflict: boolean };


interface GithubExtractorOptions {
    owner: string; 
    repo: string; 
    highlightConflicts?: boolean;
    outputStream?: NodeJS.WritableStream;
    caseInsensitive?: boolean; 
    selectedPaths?: Set<string>; 
}

const CONFLICT_COLOR = chalk.hex("#d20f39");


export class GithubExtractor {

    public caseInsensitive: GithubExtractorOptions["caseInsensitive"] = false;
    public debug: boolean = true;
    public highlightConflicts: boolean = true;
    public owner: GithubExtractorOptions["owner"];
    public repo: GithubExtractorOptions["repo"];
    public selectedPaths: GithubExtractorOptions["selectedPaths"];
    
    protected outputStream: GithubExtractorOptions["outputStream"];
    protected repoList: ListItem[] | undefined;
    protected requestFn: typeof request = request;
    

    constructor(
        { owner, repo, highlightConflicts, outputStream, caseInsensitive, selectedPaths }: GithubExtractorOptions
    ) {

        this.owner = owner;
        this.repo = repo;

        if (highlightConflicts) this.highlightConflicts = highlightConflicts;
        this.outputStream = outputStream;

        if (caseInsensitive) this.caseInsensitive = caseInsensitive;

        if (selectedPaths) {
            this.selectedPaths = this.normalizePathSet(selectedPaths);
        }
    }
    
    protected normalizeTarPath(tarPath: string) {
        // someprefixdir/somefile.txt -> somefile.txt
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

            if (statusCode !== 200) { 
                await this.handleBadResponseCode({ statusCode, headers, body, controller, url });
            }

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
        
        let res: Awaited<ReturnType<typeof this.makeRequest>> | undefined = undefined;

        try { 
            return await this.makeRequest(firstTry); 
        }
        catch (error) { 
            return await this.makeRequest(secondTry);
        }

    }


    protected async handleTypos(pathList: string[]): Promise<Typo[]> {

        if (!this.selectedPaths) return []; 

        const typos: Typo[] = [];
        for (const original of this.selectedPaths.values()) {

            const correction = closest(original, pathList);
            typos.push([original, correction]);
        }
        return typos;
    }

    public async downloadTo({ dest }: { dest: string }) {

        // const defaultBranch = await this.getDefaultBranch() ?? "master";
        const { body, controller } = await this.getTarBody();
        const internalList: string[] = [];

        try {
            await pipeline(
                body, 
                tar.extract({
                    cwd: dest,
                    strip: 1,
                    filter: (path) => {
                        path = this.normalizeTarPath(path);
                        internalList.push(path);

                        if (!path || (this.selectedPaths && !this.selectedPaths.has(path))) {
                            return false;
                        }
                        this.selectedPaths?.delete(path);
                        return true;
                    },
                    onentry: (entry) => {
                        entry.on("end", () => {
                            if (this.selectedPaths?.size === 0) {
                                controller.abort();
                            }
                        });
                    },
                })
            );

            // if we still haven't struck out all the paths, there might be typos
            return this.selectedPaths?.size ? this.handleTypos(internalList) : [];
        }
        catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                // Only one way to get to AbortError--successfully got selected files.
                return [];
            }
            else {
                throw error;
            }
        }
        finally {
            body.destroy();
        }
    }

    public async getLocalDirContents(dir: string): Promise<Set<string>> {

        const dirEnts = await fsp.readdir(dir, { withFileTypes: true });
        const slashedDirs = dirEnts
            .map(ent => ent.isDirectory() ? ent.name + "/" : ent.name)
            .map(ent => this.normalizeFilePath(ent));

        slashedDirs.sort((a, b) => {
            if (a.endsWith("/") && !b.endsWith("/")) {
                return -1;
            }
            if (!a.endsWith("/") && b.endsWith("/")) {
                return 1;
            }
            return a.localeCompare(b);
        });

        const dirSet = new Set(slashedDirs);
        return dirSet;
    }
   
    protected writeListItem(listItem: ListItem) {

        if (listItem.conflict && this.highlightConflicts) {
            this.outputStream?.write(CONFLICT_COLOR(listItem.filePath) + "\n");
        }
        else {
            this.outputStream?.write(listItem.filePath + "\n");
        }
    }

    public async getRepoList(
        { dest, conflictsOnly = false }: 
        { dest: string; conflictsOnly?: boolean }
    ): Promise<ListItem[]> {

        if (this.repoList) return this.repoList;
        
        const repoList: ListItem[] = [];
        
        let destSet: Set<string> | undefined;
        if (dest) destSet = await this.getLocalDirContents(dest);

        const handleEntry = (entry: tar.ReadEntry) => {

            const filePath = this.normalizeTarPath(entry.path);
            if (!filePath) return; 

            const conflict = !!destSet?.has(filePath);
            const listItem: ListItem = { filePath, conflict };

            if (!conflictsOnly || conflict) {
                repoList?.push(listItem);
                this.writeListItem(listItem);
            }
        };

        const { body } = await this.getTarBody();

        await pipeline(body, tar.list({ onentry: handleEntry }));

        return this.repoList = repoList;
    }
}

