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


const owner = "rhysd";
const repo = "vim.wasm";
const defaultBranch = "wasm";

const endpoint = `https://api.github.com/repos/${ owner }/${ repo }/git/trees/${ defaultBranch }?recursive=1`;

const { statusCode, headers, body } = await request(endpoint, {
    maxRedirections: 5, 
    headers: {
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
});


export class RegexPipe extends Minipass<string, string> {
    
    public regex: RegExp;
    protected hasGroup: boolean;
    private buffer: string = "";

    constructor({ regex, hasGroup }: { regex: RegExp; hasGroup: boolean }) {
        super({ encoding: "utf8" });
        
        this.regex = regex; 
        this.hasGroup = hasGroup;
    }
    
    // Write is overloaded (for some reason) so cb needs to be any.
    //   Otherwise needs to override the overloads. What a mess.
    override write(chunk: string, callback: any) {
        
        this.buffer += chunk;
        let match: RegExpExecArray | null;
        let extracted = "";
        
        while (match = this.regex.exec(this.buffer)) {

            this.buffer = this.buffer.slice(this.regex.lastIndex);
            this.regex.lastIndex = 0;
            extracted += match[1] + "\n";
        }
        return super.write(extracted, callback);
    }

}


const pathRegex = new RegExp(/"path": "(.*)"/g);
const regexPipe = new RegexPipe({ regex: pathRegex, hasGroup: true });


// const minipass = new Minipass<string>({ encoding: "utf8" });
// minipass.on("data", (chunk) => {
//     const match = chunk.match(pathRegex);
//     // // if (match?.[1]) process.stdout.write(match[1]);

//     // // if (!match?.[1]) console.log(chunk);

//     // console.log("-----------------------------------------------");
//     // // if (!match) console.log(!!chunk.match(pathRegex));
//     // if (!match) console.log(chunk);
//     // console.log("-----------------------------------------------");
// });

const collecter = new Minipass<string>({ encoding: "utf8" });


void collecter.collect().then(all => {
    console.log(all.length);
});


await pipeline(
    body,
    regexPipe,
    fs.createWriteStream(".tmp/list-regex.txt")
);
 

// await collecter.concat().then(onebigchunk => {
//     // onebigchunk is a string if the stream
//     // had an encoding set, or a buffer otherwise.
// });

// console.log(allPaths);
// console.log(allPaths.length);

