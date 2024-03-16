
import { APIFetchError, MissingInJSONError } from "./custom-errors.mjs";

import ky from "ky";
import { request, fetch } from "undici";
import mfh from "make-fetch-happen";
import { simpleGit } from "simple-git";

// mfh ~ 415ms
// undfetch ~ 430ms
// browser cold ~ 400ms
// undrequest ~ 430ms
// lsremote ~ 670ms (on cli or in node)
// ky ~ 430ms


const endpoint = "https://api.github.com/repos/rhysd/vim.wasm";
let t0 = performance.now();

const res = await ky.get(endpoint, {
    headers: {
        "Accept": "application/vnd.github+json",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
});


const text = await res.text();  
const status = res.status;
const headers = res.headers;

console.log(`${ performance.now() - t0 }ms to get text`);

if (status !== 200) { 
    throw new APIFetchError(`Error getting response from: ${ endpoint } StatusCode: ${ status } Headers: ${ JSON.stringify(headers) }, Body: ${ text.slice(0, 2000) }`);
}

console.log(text.slice(0, 100));

console.log("headers\n\n" + JSON.stringify(headers, null, 2));
