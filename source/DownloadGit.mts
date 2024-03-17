import "./shimSet.mjs";

import { FileConflictError, MissingInJSONError, APIFetchError } from "./custom-errors.mjs";
import { RegexPipe } from "./RegexPipe.mjs";

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
    owner: string; 
    repo: string; 
    outputStream?: NodeJS.WritableStream;
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
    public owner: DownloadGitOptions["owner"];
    public repo: DownloadGitOptions["repo"];
    public selectedPaths: DownloadGitOptions["selectedPaths"];
    public tarFilePath: string;
    public tarUrl: string;

    protected defaultBranch: DownloadGitOptions["defaultBranch"];
    protected mute: boolean = false;
    protected outputStream: DownloadGitOptions["outputStream"];
    
    
    protected repoList: string[] | undefined;
    

    constructor(
        { caseInsensitive, owner, repo, selectedPaths, cacheDir, defaultBranch, tarUrl, outputStream }: DownloadGitOptions
    ) {

        this.outputStream = outputStream;

        if (caseInsensitive) this.caseInsensitive = caseInsensitive;
        this.cacheDir = cacheDir ?? path.resolve(temporaryDirectory, "gitdownloads", repo);
        this.defaultBranch = defaultBranch;

        if (selectedPaths) {
            this.selectedPaths = this.normalizePathSet(selectedPaths);
        }

        this.tarUrl = tarUrl ?? `https://github.com/${ owner }/${ repo }/archive/refs/heads/master.tar.gz`;

        this.owner = owner;
        this.repo = repo;

        fs.mkdirSync(this.cacheDir, { recursive: true });

        this.tarFilePath = path.join(this.cacheDir, `${ repo }.tar.gz`);
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

    
    protected async getRequestBody() {
        
        const controller = new AbortController();

        const { statusCode, headers, body } = await request(this.tarUrl, {
            signal: controller.signal,
            maxRedirections: 5, 
            headers: {
                // "cache-control": "no-cache",
                // "pragma": "no-cache",
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

            throw new APIFetchError(`Error getting response from github StatusCode: ${ statusCode } Headers: ${ JSON.stringify(headers) }, Body: ${ (await body.text()).slice(0, 2000) }`);
        }

        return { body, controller };
    }

    protected async handleTypos(): Promise<Typo[]> {

        if (!this.selectedPaths) return []; 

        const fullList = await this.getRepoList();

        const typos: Typo[] = [];
        for (const original of this.selectedPaths.values()) {

            const correction = closest(original, fullList);
            typos.push([original, correction]);
        }
        return typos;
    }

    public async downloadTo(dest: string) {

        const { controller, body } = await this.getRequestBody();

        try {
            await pipeline(
                body, 
                tar.extract({
                    cwd: dest,
                    strip: 1,
                    filter: (path) => {
                        path = this.normalizeTarPath(path);
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
            return this.selectedPaths?.size ? this.handleTypos() : [];
        }
        catch (error) {
        
            if (error instanceof Error && error.name === "AbortError") {
                // Only one way to get to AbortError--successfully got selected files.
            }
            else if (error instanceof Error) {

                const cust = new Error(`Error extracting from github to ${ dest }. Message: ${ error.message }`);
                
                cust.stack = error.stack ?? "undefined";
                throw cust;
            }
            throw error;

        }
        finally {
            body.destroy();
        }
    }

    public async get(dest: string): Promise<string[]> {

        this.mute = true;
        const repoList = await this.getRepoList();
        this.mute = false;

        let repoSet = this.selectedPaths ?? new Set(repoList);
        repoSet = this.normalizePathSet(repoSet);

        const destEnts = await fsp.readdir(dest, { withFileTypes: true });
        const slashedDirs = destEnts.map(ent => ent.isDirectory() ? ent.name + "/" : ent.name);
        let destSet = new Set(slashedDirs);
        destSet = this.normalizePathSet(destSet);

        const conflicts = Array.from(repoSet.intersection(destSet));
        conflicts.sort((a, b) => {
            if (a.endsWith("/") && !b.endsWith("/")) {
                return -1;
            }
            if (!a.endsWith("/") && b.endsWith("/")) {
                return 1;
            }
            return a.localeCompare(b);
        });

        return conflicts;
    }
   

    public async getRepoList(conflictsOnly = false): Promise<string[]> {

        // list conflicts in red
        // add conflicts to array.

        if (this.repoList) return this.repoList;

        const repoList: string[] = [];

        const { body } = await this.getRequestBody();

        await pipeline(
            body,
            tar.list({
                onentry: (entry) => {
                    const filePath = this.normalizeTarPath(entry.path);
                    if (filePath) {
                        if (!this.mute) this.outputStream?.write(filePath + "\n");
                        repoList.push(filePath);
                    }
                },
            })
        );

        return this.repoList = repoList;
    }
}

// add getStreamingApiResponse and streaming list method.
// stdout itself is a writestream

// ! move conflicts into list

const d = new DownloadGit({
    owner: "facebook",
    repo: "react",
    // outputStream: process.stdout,
    // selectedPaths: new Set([".cron.yml"]),
});

const t0 = performance.now();

const conflicts = await d.getConflicts(".tmp");

console.log(`Time overall: ${ performance.now() - t0 }`);
console.log(conflicts);
console.log(conflicts.length);

