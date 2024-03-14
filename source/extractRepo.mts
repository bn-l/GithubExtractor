// import fetch from "make-fetch-happen";
import fs from "node:fs";
import tar from "tar";
import path from "node:path";
import { fetch } from "undici";
import { Readable } from "node:stream";


const main = "https://github.com";

const repopath = "/WaterfoxCo/Waterfox";

const tarurl = main + repopath + "/archive/refs/heads/master.tar.gz"; 

const file = "/dom/ipc/tests/browser_crash_oopiframe.js";


const controller = new AbortController();
const { signal } = controller;

const res = await fetch(tarurl, { signal });
const stream = Readable.from(res.body!).pipe(tar.extract({ 
    cwd: "./.tmp/",
    onentry: entry => {
        if (entry.path.endsWith(file)) {
            console.log(`found ${ file } in ${ entry.path }`);

            // save file
            entry.pipe(fs.createWriteStream(entry.path)).on("finish", () => {
                // abort the fetch request
                controller.abort();
            });
        }
    },
}));

// .pipe(parse).on("entry", entry => {
//     console.log(entry.path);
//     // if (entry.path.endsWith(file)) {
//     //     console.log(`found ${ file } in ${ entry.path }`);

//     //     // save file
//     //     entry.pipe(fs.createWriteStream(path.join(".tmp", entry.path))).on("finish", () => {
//     //         // abort the fetch request
//     //         controller.abort();
//     //     });
//     // }
// }).on("finish", () => {
//     console.log("finished");
// });


// const res = await fetch(tarurl, { signal }).then(res => res.body?.pipeTo(tar.x({
//     cwd: "./.tmp/",
//     onentry: entry => {
//         if (entry.path.endsWith(file)) {
//             console.log(`found ${ file } in ${ entry.path }`);

//             // save file
//             entry.pipe(fs.createWriteStream(entry.path)).on("finish", () => {
//                 // abort the fetch request
//                 controller.abort();
//             });
//         }
//     },
// })));


// res.body
//     .pipe(parse)
//     .on("entry", function(entry) {
//         if (entry.path.endsWith(file)) {
//             console.log("found myfile");

//             // save file
//             entry.pipe(fs.createWriteStream(entry.path)).on("finish", function() {
//             // abort the fetch request
//                 // controller.abort();
//             });
//         }
//     });


// const parse = new tar.Parse();

// await res.body?.pipeTo(parse.on("entry", function(entry) {
//     if (entry.path == "myfile") {
//         console.log("found myfile");

//         // save file
//         entry.pipe(fs.createWriteStream(entry.path)).on("finish", function() {
//             // abort the fetch request
//             controller.abort();
//         });
//     }
// }));
