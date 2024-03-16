import "./shimSet.mjs";

import { FileConflictError } from "./custom-errors.mjs";

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

type NonExistantPaths = { allPaths: string[]; nonExistant: string[] };


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
    caseInsensitive: boolean; 
    dest: string; 
    owner: string; 
    repo: string; 
    cacheDir?: string;
    selectedPaths?: Set<string>; 
    defaultBranch?: string; 
    tarUrl?: string;
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
    protected foundPaths: string[] = [];
    protected repoList: string[] | undefined;
    

    constructor(
        { caseInsensitive, dest, owner, repo, selectedPaths, cacheDir, defaultBranch, tarUrl }: DownloadGitOptions
    ) {

        this.caseInsensitive = caseInsensitive;
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
 
    protected async getDefaultBranch() {

        if (this.defaultBranch) return this.defaultBranch;

        const url = `https://api.github.com/repos/${ this.owner }/${ this.repo }`;
        const { statusCode, headers, body } = await request(url);
        const data = await body.json() as { default_branch: string };
        
        if (!("default_branch" in data)) {
            throw new Error("No default branch found in response from " + url);
        }

        return this.defaultBranch = data.default_branch;
    }

    protected async getTarUrl() {
        if (this.tarUrl) return this.tarUrl;
        const defaultBranch = await this.getDefaultBranch();
        const url = `https://github.com/${ this.owner }/${ this.repo }/archive/refs/heads/${ defaultBranch }.tar.gz`;
        return this.tarUrl = url;
    }

    protected dualPipe(controller: AbortController) {
        const teePipe = new Minipass();

        const writePipe = new fsm.WriteStream(this.tarFilePath);

        const extractPipe = tar.extract({
            cwd: this.selectedPaths ? this.dest : this.cacheDir,
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
                this.foundPaths.push(entry.path);
                entry.on("end", () => {
                    if (this.selectedPaths?.size === 0) controller.abort();
                });
            },
        });
        
        teePipe.pipe(writePipe);
        teePipe.pipe(extractPipe);

        return teePipe;
    }

    public async download(): Promise<NonExistantPaths> {

        await this.getDefaultBranch();

        const foundPaths: string[] = []; // used to find nonexistant (and maybe typo) paths

        const tarurl = await this.getTarUrl();
        const controller = new AbortController();
        const dualPipe = this.dualPipe(controller);
        const { statusCode, headers, body } = await request(tarurl, { maxRedirections: 5, signal: controller.signal });

        try {
            await pipeline(body, dualPipe);
        }
        catch (error) {
            
            await rimraf(this.tarFilePath, { preserveRoot: true });

            if (error instanceof Error && error.name !== "AbortError") {

                const cust = new Error(`Error extracting ${ tarurl } to ${ this.cacheDir }. Message: ${ error.message }, statusCode: ${ statusCode }, headers: ${ JSON.stringify(headers) }`);
                
                cust.stack = error.stack ?? "undefined";
                throw cust;
            }
            throw error;
        }

        return { allPaths: foundPaths, nonExistant: Array.from(this.selectedPaths ?? []) };
    }

    public async getConflicts() {
        
        const repoList = await this.getRepoList();

        let repoSet = new Set(this.selectedPaths ?? repoList);
        repoSet = this.normalizePathSet(repoSet);

        let destSet = new Set(await fsp.readdir(this.dest));
        destSet = this.normalizePathSet(destSet);

        const conflicts = repoSet.intersection(destSet);

        return conflicts;
    }

    public async getRepoList() {
        await this.getDefaultBranch();
        if (this.repoList) return this.repoList;

        const endpoint = `https://api.github.com/repos/${ this.owner }/${ this.repo }/git/trees/${ this.defaultBranch }?recursive=1`;
        
        const { statusCode, headers, body } = await request(endpoint);
        const data = (await body.json()) as GHTreeReponse;
    
        const pathsFromApi: string[] = [];
    
        for (const treeEnt of data.tree) {
            pathsFromApi.push(this.normalizeFilePath(treeEnt.path));
        }
        
        if (data.truncated) {
            const { allPaths: pathsFromTar } = await this.download();
            return pathsFromTar;
        }
        
        return pathsFromApi;
    }


    public async moveFilesIn(
        { selectedFiles, force = false }:
        { selectedFiles?: Set<string>; force: boolean }
    ) {
        
        
        if (!force) {
            const conflicts = await this.getConflicts();
            if (conflicts.size) {
                throw new FileConflictError({ conflicts: Array.from(conflicts) });
            }
        }
        
        if (selectedFiles) selectedFiles = this.normalizePathSet(selectedFiles);
        await this.download(selectedFiles);
        
        const cacheDirContents = await fsp.readdir(this.cacheDir);

        await pMap(cacheDirContents, async(ent) => {
            const src = path.join(this.cacheDir, ent);
            const dest = path.join(this.dest, ent);

            return fsp.cp(src, dest, { preserveTimestamps: true });

        }, { concurrency: 10 });

    }
    
    public async clearCache() {
        this.repoList = undefined;
        this.defaultBranch = undefined;

        await rimraf(this.cacheDir, { preserveRoot: true });
    }

}
