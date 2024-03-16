import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import zlib from "node:zlib";
import tar from "tar";
import { request, fetch } from "undici";
import fastlev from "fastest-levenshtein";
import { rimraf } from "rimraf";


const { closest } = fastlev;


const parse = new tar.Parse();
const gzip = zlib.createGzip();


const foundPaths: string[] = []; // used to find nonexistant (and maybe typo) paths

const tarurl = "https://github.com/rhysd/vim.wasm/archive/refs/heads/wasm.tar.gz";

const ac = new AbortController();
const { signal } = ac;

const { statusCode, headers, body } = await request(tarurl, { maxRedirections: 5, signal });

// Change the behaviour depending on the size of the content length header.

// if (Number(headers["content-length"]) > 2110000) {
//     ac.abort();
// }

// console.log(statusCode, headers);

// RequestAbortedError [AbortError]

const t0 = performance.now();

const entries: string[] = [];

await pipeline(
    body,
    // fs.createWriteStream(".tmp/tar.tar.gz")
    tar.extract({
        cwd: ".tmp/",
        onentry(entry) {
            entries.push(entry.path);
        },
    })
);

console.log(`Headers: ${ JSON.stringify(headers, null, 4) }`);
console.log(`${ performance.now() - t0 }ms to download and extract tar`);
console.log(`Got ${ entries.length } entries`);

// rhysd/vim.wasm ~ 4000 ms - 58315265 bytes, 4340 files

// rimraf(".tmp/*", { glob: true });
