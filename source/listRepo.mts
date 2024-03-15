import { fetch } from "undici";
import fs from "node:fs";
import { extract } from "tar";

// owner/repo/path

const main = "https://github.com";

const repopath = "/WaterfoxCo/Waterfox";

const queryparams = "?recursive=1";
const listendpoint = "https://api.github.com/repos" + repopath + "/git/trees/current" + queryparams; 


// Getting raw file (non base64)
// https://raw.githubusercontent.com/:owner/:repo/master/:path

const tarurl = main + repopath + "/archive/refs/heads/master.tar.gz"; 

// Add root folder path (e.g. /SeleniumHQ/selenium) to list of paths
// prefix paths with "/"

// ! Attempt list, if response is truncated, explain and tar to a temp folder. 
// "If truncated is true in the response then the number of items in the tree array exceeded our maximum limit."
// The limit for the tree array is 100,000 entries

// When truncated and outputting from a tar, check membership in fileset from list before outputting.

//
console.log("fetching list from", listendpoint);
let t0 = performance.now();
let res = await fetch(listendpoint);
const json = await res.json();
fs.writeFileSync(".tmp/list.json", JSON.stringify(json, null, 2));
console.log("list took:", performance.now() - t0);
// console.log(json);

// const { body } = await client.request({
//     path: '/',
//     method: 'GET'
//   })
//   body.destroy()

export function listRepo(
    { dest, owner, repo, defaultBranch }
) {
    
    const endpoint = `https://api.github.com/repos/${ owner }/${ repo }/git/trees/${ defaultBranch }?recursive=1`;
    
    const list = fetch(endpoint, {});


}
