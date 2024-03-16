// import fetch from "make-fetch-happen";
import fs from "node:fs";
import tar from "tar";
import path from "node:path";
import { fetch } from "undici";
import { Readable } from "node:stream";
import logUpdate from "log-update";
import zlib from "node:zlib";
import { pipeline } from "node:stream/promises";


const main = "https://github.com";

const repopath = "/WaterfoxCo/Waterfox";

const tarurl = main + repopath + "/archive/refs/heads/master.tar.gz"; 

const file = "/dom/ipc/tests/browser_crash_oopiframe.js";


const parse = new tar.Parse();
const gzip = zlib.createGzip();


const controller = new AbortController();
const { signal } = controller;

const res = await fetch(tarurl, { signal });
await pipeline(
    Readable.from(res.body!),
    gzip
        .pipe(parse)
        .on("entry", entry => {
            console.log(entry.path);
            if (entry.path.endsWith(file)) {
                console.log("found file");
                
            }
            entry.resume();
        })
);
