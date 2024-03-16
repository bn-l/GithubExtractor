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

const pathSet = new Set([".github/ISSUE_TEMPLATE/config.yml"].map(p => p.toLowerCase()));

await pipeline(
    body,
    tar.extract({
        cwd: "./.tmp/",
        strip: 1,
        filter(path) {
            path = path.toLowerCase();
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

// await pipeline(
//     body,
//     gzip
//         .pipe(parse)
//         .on("entry", entry => {

//             const normalizedPath = normalizePath(entry.path);

//             if (!selectedFiles || selectedFiles.has(normalizedPath)) {
//                 const normalizedPath = normalizePath(entry.path);

//                 foundPaths.push(normalizedPath);
//                 selectedFiles?.delete(normalizedPath);
//                 const savePath = path.join(repoDest, normalizedPath);

//                 fs.mkdirSync(path.dirname(savePath), { recursive: true });

//                 entry.pipe(fs.createWriteStream(savePath).on("finish", () => {
//                     // if we've found all the selected files, end the stream:
//                     if (selectedFiles && selectedFiles.size === 0) {
//                         body.destroy();
//                     }
//                 }));
//             }

//             entry.resume();
//         })
// );
