import mfhfetch from "make-fetch-happen";
import tar from "tar";
import fs from "node:fs";
import logUpdate from "log-update";
import { simpleGit } from "simple-git";
import zlib from "node:zlib";


// !! If main doesn't work try master

const repourl = "https://github.com/vuejs/devtools";

const tarurl = repourl + "/archive/refs/heads/master.tar.gz"; 

const files: string[] = [];

const cwd = "./.tmp/";
fs.mkdirSync(cwd, { recursive: true });

const extractor = tar.extract({ cwd });

const res = await mfhfetch(tarurl);

// Test fast ending when found file

let t0 = performance.now();
await new Promise((resolve, reject) => {
    if (res.status !== 200) {
        console.error("Failed to fetch tarball, status code: ", res.status, res.statusText);
    }
    else {
        res.body.pipe(extractor).on("finish", resolve).on("error", reject);
    }
});
console.log("Extracting took: ", performance.now() - t0);

const git = simpleGit({ baseDir: cwd });


// fstream
//     .pipe(zlib.unzip()) 
//     .pipe(tar.Parse())
//     .on("entry", function(entry) {
//         if (entry.path == "myfile") {
//             console.log("found myfile");

//             // save file
//             entry.on("end", function() {
//                 fstream.close();
//             }).pipe(fs.createWriteStream(entry.path));
//         }
//     });


// t0 = performance.now();
// await git.clone("https://github.com/npm/minipass-fetch", "devtools", [ "--depth", "1" ]);
// console.log("Cloning took: ", performance.now() - t0);
