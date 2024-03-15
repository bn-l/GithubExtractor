import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import zlib from "node:zlib";
import tar from "tar";
import { request } from "undici";
import fastlev from "fastest-levenshtein";


const { closest } = fastlev;

// https://github.com/WaterfoxCo/Waterfox/archive/refs/heads/master.tar.gz


// Waterfox-current/accessible/tests/mochitest/events/test_selection.html

// const main = "https://github.com";

// const repopath = "/WaterfoxCo/Waterfox";

// const tarurl = main + repopath + "/archive/refs/heads/master.tar.gz"; 

// const file = "/dom/ipc/tests/browser_crash_oopiframe.js";


type PossibleTypos = { allPaths: string[]; missing: string[] };

export async function extractRepo(
    { dest, owner, repo, defaultBranch, selected = [] }: 
    { defaultBranch: string; dest: string; owner: string; repo: string; selected: string[] }
): Promise<PossibleTypos> {
    
    const selective = selected.length > 0; 
    selected = selected.map(file => {
        return `${ repo }-${ defaultBranch }/${ file }`.toLowerCase();
    });

    const fileSet = new Set(selected);
    const tarurl = `https://github.com/${ owner }/${ repo }/archive/refs/heads/${ defaultBranch }.tar.gz`;

    const parse = new tar.Parse();
    const gzip = zlib.createGzip();

    const controller = new AbortController();
    const { signal } = controller;

    const foundPaths: string[] = [];

    const res = await fetch(tarurl, { signal });
    
    const { statusCode, headers, body } = await request(tarurl);

    await pipeline(
        body,
        gzip
            .pipe(parse)
            .on("entry", entry => {
                if (!selective || fileSet.has(entry.path.toLowerCase())) {

                    foundPaths.push(entry.path);
                    fileSet.delete(entry.path);
                    fs.mkdirSync(path.dirname(path.join(dest, entry.path)), { recursive: true });

                    entry.pipe(fs.createWriteStream(path.join(dest, entry.path)).on("finish", () => {
                        if (selective && fileSet.size === 0) body.destroy();
                    }));
                    entry.resume();
                } 
            })
    );

    return { allPaths: foundPaths, missing: Array.from(fileSet) };
}
