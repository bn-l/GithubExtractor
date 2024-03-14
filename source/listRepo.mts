import fetch from "make-fetch-happen";
import fs from "node:fs";
import { extract } from "tar";

// owner/repo/path

const main = "https://github.com";

const repopath = "/WaterfoxCo/Waterfox";

const queryparams = "?recursive=1";
const listendpoint = "https://api.github.com/repos" + repopath + "/git/trees/current" + queryparams; 

// default branch:
// https://api.github.com/repos/facebook/react

// Getting raw file (non base64)
// https://raw.githubusercontent.com/:owner/:repo/master/:path

const tarurl = main + repopath + "/archive/refs/heads/master.tar.gz"; 

// Add root folder path (e.g. /SeleniumHQ/selenium) to list of paths
// prefix paths with "/"

// ! Attempt list, if response is truncated, explain and tar to a temp folder. 
// "If truncated is true in the response then the number of items in the tree array exceeded our maximum limit."
// The limit for the tree array is 100,000 entries

// List
console.log("fetching list from", listendpoint);
let t0 = performance.now();
let res = await fetch(listendpoint);
const json = await res.json();
fs.writeFileSync(".tmp/list.json", JSON.stringify(json, null, 2));
console.log("list took:", performance.now() - t0);
// console.log(json);

// Tar

// t0 = performance.now();
// res = await fetch(tarurl);
// res.body.pipe(extract({ cwd: ".tmp" })).on("finish", () => console.log("tar took:", performance.now() - t0));

