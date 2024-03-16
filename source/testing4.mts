import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import zlib from "node:zlib";
import tar from "tar";
import { request, fetch } from "undici";
import fastlev from "fastest-levenshtein";


const { closest } = fastlev;


const parse = new tar.Parse();
const gzip = zlib.createGzip();


const foundPaths: string[] = []; // used to find nonexistant (and maybe typo) paths

const tarurl = "https://github.com/WaterfoxCo/Waterfox/archive/refs/heads/current.tar.gz";

const { statusCode, headers, body } = await request(tarurl, { maxRedirections: 5 });

// console.log(statusCode, headers);

const pathSet = new Set([".cron.yml"].map(p => p.toLowerCase()));

// RequestAbortedError [AbortError]

try {
    await pipeline(
        body,
        tar.extract({
            cwd: ".tmp/",
            strip: 1,
            filter(path) {
                path = path.slice(path.indexOf("/") + 1).toLowerCase();
                console.log(path);
                if (pathSet.has(path)) {
                    pathSet.delete(path);
                    return true;
                }
                return false;
            },
            onentry(entry) {
                entry.on("end", () => {
                    if (pathSet.size === 0) body.destroy();
                });
            },
        })
    );
}
catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
        console.log("yeap");
    }
}
