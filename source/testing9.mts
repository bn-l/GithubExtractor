import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import zlib from "node:zlib";
import tar from "tar";
import { request, fetch } from "undici";
import fastlev from "fastest-levenshtein";
import { rimraf } from "rimraf";
import { Minipass } from "minipass";


const { closest } = fastlev;


const parse = new tar.Parse();
const gzip = zlib.createGzip();


const foundPaths: string[] = []; // used to find nonexistant (and maybe typo) paths

const tarurl = "https://github.com/rhysd/vim.wasm/archive/refs/heads/wasm.tar.gz";

// https://codeload.github.com/rhysd/vim.wasm/tar.gz/wasm

const ac = new AbortController();
const { signal } = ac;

const { statusCode, headers, body } = await request(tarurl, { maxRedirections: 5, signal, 
    method: "GET",
    headers: {
        // "accept": "application/x-gzip",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
});

// Change the behaviour depending on the size of the content length header.

// if (Number(headers["content-length"]) > 2110000) {
//     ac.abort();
// }

// console.log(statusCode, headers);

// RequestAbortedError [AbortError]

const t0 = performance.now();

const entries: string[] = [];

const m = new Minipass();
m.on("data", async(chunk) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(chunk.toString());
});


await pipeline(
    body,
    fs.createWriteStream(".tmp/tar.tar.gz")
    // tar.list({
    //     cwd: ".tmp/",
    //     onentry: (entry) => {
    //         entries.push(entry.path);
    //     },
    // })
    // tar.extract({
    //     cwd: ".tmp/",
    //     // onentry(entry) {
    //     //     entries.push(entry.path);
    //     // },
    // })
);

console.log(`Headers: ${ JSON.stringify(headers, null, 4) }`);
console.log(`${ performance.now() - t0 }ms to download and extract tar`);
console.log(`Got ${ entries.length } entries`);


// await rimraf(".tmp/*", { glob: true });   

// download and extract
// rhysd/vim.wasm ~ 4000 ms - 58,315,265 bytes, 4,340 files
// facebook/react ~ 3267 ms - 23,273,089 bytes, 2,593 Files

// react: list:  1300ms, just tar: 1300ms
// vim.wasm: list: 4000ms, just tar: 4000ms, 
