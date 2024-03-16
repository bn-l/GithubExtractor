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


export class DownloadGit {

    public cacheDir: string;
    public dest: string;
    public owner: string;
    public repo: string;
    public selectedFiles: string[] | undefined;
    
    protected defaultBranch: string | undefined;
    protected repoList: string[] | undefined;

    constructor(
        { dest, owner, repo, selectedFiles, cacheDir, defaultBranch }:
        { dest: string; owner: string; repo: string; selectedFiles?: string[]; defaultBranch?: string; cacheDir?: string }
    ) {

        this.cacheDir = cacheDir ?? path.resolve(temporaryDirectory, "gitdownloads", repo);
        this.defaultBranch = defaultBranch;
        this.selectedFiles = selectedFiles;
        this.dest = dest;
        this.owner = owner;
        this.repo = repo;

        fs.mkdirSync(this.cacheDir, { recursive: true });
        fs.mkdirSync(this.dest, { recursive: true });
    }
    
    protected normalizePath(filePath: string) {
        return filePath.toLowerCase();
    }

    protected normalizePathSet(filePathSet: Set<string>) {
        const valueArray = Array.from(filePathSet.values());
        const normalized = valueArray.map(filePath => this.normalizePath(filePath));
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

    
    public async downloadRepo(selectedFiles?: Set<string>): Promise<NonExistantPaths> {

        await this.getDefaultBranch();

        if (selectedFiles) selectedFiles = this.normalizePathSet(selectedFiles);

        const tarurl = `https://github.com/${ this.owner }/${ this.repo }/archive/refs/heads/${ this.defaultBranch }.tar.gz`;

        const foundPaths: string[] = []; // used to find nonexistant (and maybe typo) paths

        const { statusCode, headers, body } = await request(tarurl, { maxRedirections: 5 });

        try {
            await pipeline(
                body,
                tar.extract({
                    cwd: this.cacheDir,
                    strip: 1,
                    filter(path) {
                        path = path.toLowerCase();
                        if (selectedFiles?.has(path)) {
                            selectedFiles.delete(path);
                            return true;
                        }
                        return false;
                    },
                    onentry(entry) {
                        foundPaths.push(entry.path);
                        entry.on("end", () => {
                            if (selectedFiles?.size === 0) body.destroy();
                        });
                    },
                })
            );
        }
        catch (error) {
            // @ts-expect-error no guard
            const cust = new Error(`Error extracting ${ tarurl } to ${ this.cacheDir }. Message: ${ error.message }, statusCode: ${ statusCode }, headers: ${ JSON.stringify(headers) }`);
            // @ts-expect-error no guard
            cust.stack = error.stack;
            throw cust;
        }

        return { allPaths: foundPaths, nonExistant: Array.from(selectedFiles ?? []) };
    }

    public async getConflicts() {
        
        const repoList = await this.getRepoList();

        let repoSet = new Set(this.selectedFiles ?? repoList);
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
            pathsFromApi.push(this.normalizePath(treeEnt.path));
        }
        
        if (data.truncated) {
            const { allPaths: pathsFromTar } = await this.downloadRepo();
            return pathsFromTar;
        }
        
        return pathsFromApi;
    }

    protected async hashPipeline(filePath: string) {

        const hash = crypto.createHash("MD5");

        await pipeline(
            fs.createReadStream(filePath, { encoding: "utf8" }),
            crypto.createHash("MD5")
        );

        const hashDigest = hash.digest("hex");
        return [filePath, hashDigest];
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
        await this.downloadRepo(selectedFiles);
        
        const repoList = await this.getRepoList();

        await pMap(repoList, async(filePath) => {
            const src = path.join(this.cacheDir, filePath);
            const dest = path.join(this.dest, filePath);

            return fsp.cp(src, dest, { preserveTimestamps: true });
        }, { concurrency: 10 });

        if (selectedFiles) {
            await fsp.cp(this.cacheDir, this.dest, { 
                recursive: true, force: true, preserveTimestamps: true, filter: (source, _) => {
                    const normalizedRelSource = path.relative(this.cacheDir, source).toLowerCase();
                    return !selectedFiles || selectedFiles.has(normalizedRelSource);
                },
            });
        }
        else {
            await fsp.cp(this.cacheDir, this.dest, { recursive: true, force: true, preserveTimestamps: true });
        }
    }
    
    public async clearCache() {
        this.repoList = undefined;
        this.defaultBranch = undefined;

        await rimraf(this.cacheDir, { preserveRoot: true });
    }

}
