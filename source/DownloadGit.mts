import "./shimSet.mjs";

import { FileConflictError, MissingInJSONError, APIFetchError } from "./custom-errors.mjs";

import fastlev from "fastest-levenshtein";
import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { rimraf } from "rimraf";
import tar from "tar";
import temporaryDirectory from "temp-dir";
import { request } from "undici";
import pMap from "p-map";
import { Minipass } from "minipass";
import fsm from "fs-minipass";


const { closest } = fastlev;

type Typo = [original: string, correction: string];

type ListResult = { status: "truncated" | "full"; repoList: string[] };

interface GHTreeReponse {
    sha: string;
    tree: {
        mode: string;
        path: string;
        sha: string;
        size: number;
        type: string;
        url: string;
    }[];
    truncated: boolean;
    url: string;
}

interface DownloadGitOptions {
    dest: string; 
    owner: string; 
    repo: string; 
    caseInsensitive?: boolean; 
    cacheDir?: string;
    selectedPaths?: Set<string>; 
    defaultBranch?: string; 
    tarUrl?: string;
}

interface BaseReposResponse {
    default_branch: string;
}

export class DownloadGit {

    public cacheDir: string;
    public caseInsensitive: DownloadGitOptions["caseInsensitive"] = false;
    public dest: DownloadGitOptions["dest"];
    public owner: DownloadGitOptions["owner"];
    public repo: DownloadGitOptions["repo"];
    public selectedPaths: DownloadGitOptions["selectedPaths"];
    public tarFilePath: string;
    public tarUrl: DownloadGitOptions["tarUrl"];

    protected defaultBranch: DownloadGitOptions["defaultBranch"];
    protected repoList: ListResult | undefined;
    

    constructor(
        { caseInsensitive, dest, owner, repo, selectedPaths, cacheDir, defaultBranch, tarUrl }: DownloadGitOptions
    ) {

        if (caseInsensitive) this.caseInsensitive = caseInsensitive;
        this.cacheDir = cacheDir ?? path.resolve(temporaryDirectory, "gitdownloads", repo);
        this.defaultBranch = defaultBranch;

        if (selectedPaths) this.selectedPaths = this.normalizePathSet(selectedPaths);

        this.tarUrl = tarUrl;
        
        this.dest = dest;
        this.owner = owner;
        this.repo = repo;

        fs.mkdirSync(this.cacheDir, { recursive: true });
        fs.mkdirSync(this.dest, { recursive: true });

        this.tarFilePath = path.join(this.cacheDir, `${ repo }.tar.gz`);
    }
    
    protected normalizeTarPath(tarPath: string) {
        // someprefixdir/somefile.txt -> somefile.txt
        return this.caseInsensitive ?
            tarPath.slice(tarPath.indexOf("/") + 1).toLowerCase() :
            tarPath.slice(tarPath.indexOf("/") + 1);
    }

    protected normalizeFilePath(filePath: string) {
        return this.caseInsensitive ? filePath.toLowerCase() : filePath;
    }

    protected normalizePathSet(filePathSet: Set<string>) {
        const valueArray = Array.from(filePathSet.values());
        const normalized = valueArray.map(filePath => this.normalizeFilePath(filePath));
        return new Set(normalized);
    }

    protected async getApiResponse<TResponseObject extends object>(endpoint: string, expectedTopLevel: string[]) {
        
        const t0 = performance.now();

        const { statusCode, headers, body } = await request(endpoint, {
            maxRedirections: 5, 
            headers: {
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            },
        });

        if (statusCode !== 200) { 

            const { "x-ratelimit-remaining": remaining, "x-ratelimit-reset": resetIn } = headers;

            if (remaining && Number(remaining) === 0) {
                const resetInDateNum = new Date(Number(resetIn)).getTime();

                const wait = !Number.isNaN(resetInDateNum) ? 
                    Math.ceil((resetInDateNum * 1000) - Date.now() / 1000 / 60) :
                    undefined;

                throw new APIFetchError("Rate limit exceeded" + (resetIn ? `Please wait ${ wait } minutes` : ""));
            }

            throw new APIFetchError(`Error getting response from: ${ endpoint } StatusCode: ${ statusCode } Headers: ${ JSON.stringify(headers) }, Body: ${ (await body.text()).slice(0, 2000) }`);
        }

        let text = await body.text();

        try {
            const parsed = JSON.parse(text) as TResponseObject;

            if (!expectedTopLevel.every(key => key in parsed)) {
                throw new MissingInJSONError(`Could not find: ${ expectedTopLevel.join(", ") }, in json returned from: ${ endpoint }`);
            }

            console.log(`${ performance.now() - t0 }ms to get response from ${ endpoint }`);
            
            return parsed;
        }
        catch (error) {
            throw error;
        }
    }
 
    protected async getDefaultBranch() {

        if (this.defaultBranch) return this.defaultBranch;

        const url = `https://api.github.com/repos/${ this.owner }/${ this.repo }`;
        
        const { default_branch } = await this.getApiResponse<BaseReposResponse>(url, ["default_branch"]);

        return this.defaultBranch = default_branch;
    }

    protected async getTarUrl() {
        if (this.tarUrl) return this.tarUrl;

        const defaultBranch = await this.getDefaultBranch();
        const url = `https://github.com/${ this.owner }/${ this.repo }/archive/refs/heads/${ defaultBranch }.tar.gz`;

        return this.tarUrl = url;
    }

    protected async handleTypos(): Promise<Typo[]> {

        if (!this.selectedPaths) return [];

        const { repoList } = await this.getRepoList();

        const typos: Typo[] = [];
        for (const original of this.selectedPaths.values()) {

            const correction = closest(original, repoList);
            typos.push([original, correction]);
        }
        return typos;
    }

    public async downloadIntoDest() {

        const tarurl = await this.getTarUrl();
        const controller = new AbortController();
        const { statusCode, headers, body } = await request(tarurl, { maxRedirections: 5, signal: controller.signal });

        try {
            await pipeline(
                body, 
                tar.extract({
                    cwd: this.dest,
                    strip: 1,
                    filter: (path) => {
                        path = this.normalizeTarPath(path);
                        if (this.selectedPaths?.has(path)) {
                            this.selectedPaths.delete(path);
                            return true;
                        }
                        return false;
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

            return [];
        }
        catch (error) {
        
            if (error instanceof Error && error.name === "AbortError") {
                // if we still haven't struck out all the paths, there might be typos
                if (this.selectedPaths?.size) return this.handleTypos();
            }
            else if (error instanceof Error) {

                const cust = new Error(`Error extracting ${ tarurl } to ${ this.cacheDir }. Message: ${ error.message }, statusCode: ${ statusCode }, headers: ${ JSON.stringify(headers) }`);
                
                cust.stack = error.stack ?? "undefined";
                throw cust;
            }
            throw error;

        }
        finally {

            body.destroy();
            await rimraf(this.tarFilePath, { preserveRoot: true });
        }
    }

    public async getConflicts() {
        
        const { repoList } = await this.getRepoList();

        let repoSet = new Set(this.selectedPaths ?? repoList);
        repoSet = this.normalizePathSet(repoSet);

        let destSet = new Set(await fsp.readdir(this.dest));
        destSet = this.normalizePathSet(destSet);

        const conflicts = repoSet.intersection(destSet);

        return conflicts;
    }

    public async getRepoList(): Promise<ListResult> {

        if (this.repoList) return this.repoList;

        const defaultBranch = await this.getDefaultBranch();

        const endpoint = `https://api.github.com/repos/${ this.owner }/${ this.repo }/git/trees/${ defaultBranch }?recursive=1`;
        
        const { tree, truncated } = await this.getApiResponse<GHTreeReponse>(endpoint, ["tree"]);

        const repoList = tree.map(({ path }) => path);

        return this.repoList = { status: truncated ? "truncated" : "full", repoList };
    }
}

// add getStreamingApiResponse and streaming list method.
// stdout itself is a writestream


const d = new DownloadGit({
    dest: ".tmp",
    owner: "sindresorhus",
    repo: "ky",
    selectedPaths: new Set([".cron.yml"]),
});

const t0 = performance.now();

const { repoList, status } = await d.getRepoList();

console.log(status, repoList.length);

console.log(`Time overall: ${ performance.now() - t0 }`);

// sindresorhus ky ~ 803 ms
