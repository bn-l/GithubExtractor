import { GithubExtractor } from "../source/GithubExtractor.mjs";

import { bench, describe, BenchOptions, afterAll, beforeAll, beforeEach, afterEach } from "vitest";
import { simpleGit } from "simple-git";
import fs from "node:fs";


const BENCH_CLONE_DIR = ".tmp/bench/BENCH_CLONE_DIR";
const BENCH_EXTRACT_DIR = ".tmp/bench/BENCH_EXTRACT_DIR";

fs.mkdirSync(BENCH_CLONE_DIR, { recursive: true });
fs.mkdirSync(BENCH_EXTRACT_DIR, { recursive: true });

const owner = "facebook";
const repo = "react";
const repoUrl = "https://github.com/facebook/react";

// const owner = "Call-for-Code";
// const repo = "Project-Sample";
// const repoUrl = "https://github.com/Call-for-Code/Project-Sample";


const benchMarkOptions: BenchOptions = {
    iterations: 5,
    time: 5000,
    warmupIterations: 0,
    warmupTime: 0,
    now: () => performance.now(),
    setup: () => {
        fs.mkdirSync(BENCH_CLONE_DIR, { recursive: true });
        fs.mkdirSync(BENCH_EXTRACT_DIR, { recursive: true });
    },
    teardown: () => {
        fs.rmSync(BENCH_CLONE_DIR, { recursive: true });
        fs.rmSync(BENCH_EXTRACT_DIR, { recursive: true });
    },
};

const git = simpleGit({ baseDir: BENCH_CLONE_DIR });
const ghe = new GithubExtractor({ owner, repo });


describe("GithubExtractor Vs git clone depth=1", () => {

    bench("git clone", async() => {

        await git.clone(repoUrl, `${ Math.floor(Math.random() * 1000) }`, [ "--depth", "1" ]);

    }, benchMarkOptions);

    bench("GithubExtractor", async() => {
        Math.floor(Math.random() * 1000);
        await ghe.downloadTo({ dest: BENCH_EXTRACT_DIR });
    
    }, benchMarkOptions);


});
