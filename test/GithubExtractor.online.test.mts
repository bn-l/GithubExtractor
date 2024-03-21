import { describe, expect, it, vi, beforeEach, afterEach, afterAll, beforeAll, VitestUtils } from "vitest";

import sinon, { SinonSpy } from "sinon";

vi.mock("undici", async(originalImport) => {
    const mod = await originalImport<typeof import("undici")>();
    return {
        ...mod,
        request: sinon.spy(mod.request),
    };
});

import { GithubExtractor } from "../source/GithubExtractor.mjs";
import { APIFetchError } from "../source/custom-errors.mjs";

import { request } from "undici";
import fs from "node:fs";

import { Readable } from "node:stream";
// import { SerializableErrror } from "tar"


const TEST_OWNER = "octocat";
const TEST_REPO = "Spoon-Knife";
const TEST_TEMP_DIR = "./tests/TEST_TEMP_DIR";




beforeAll(() => {
    // sinon.restore();
    // vi.restoreAllMocks();
    fs.mkdirSync(TEST_TEMP_DIR, { recursive: true });
});

beforeEach(async() => {
    await new Promise((res) => setTimeout(res, Math.random() * 1000));

    fs.rmSync(TEST_TEMP_DIR, { recursive: true });
    fs.mkdirSync(TEST_TEMP_DIR, { recursive: true });

    sinon.reset();
    // @ts-expect-error testing
    request.resetHistory();
    vi.restoreAllMocks();
});

afterEach(() => {
    // @ts-expect-error testing
    request.resetHistory();
    vi.restoreAllMocks();
});


afterAll(() => {

});


// Other:
// -----------
// test that list and download produce the same result


describe.sequential("getTarBody", context => {

    it("gets the tar immediately if the default branch is main", async() => {

        const owner = "octocat";
        const repo = "Spoon-Knife"; // main default branch

        const ghe = new GithubExtractor({ owner, repo });

        const res = await ghe["getTarBody"]();

        // @ts-expect-error testing
        sinon.assert.calledOnce(request);
        // @ts-expect-error testing
        sinon.assert.calledOnceWithMatch(request, `https://codeload.github.com/${ owner }/${ repo }/tar.gz/main`);

        expect(res.statusCode).toBe(200);
        expect(res.headers["content-type"]).toBe("application/x-gzip");

        sinon.reset();
    });

    
    it("makes a second call if the default branch is not main then gets it correctly", async() => {

        const owner = "octocat";
        const repo = "Hello-World"; // master default branch

        const ghe = new GithubExtractor({ owner, repo });

        const res = await ghe["getTarBody"]();

        // @ts-expect-error testing
        sinon.assert.calledTwice(request);
    
        expect(res.statusCode).toBe(200);
        expect(res.headers["content-type"]).toBe("application/x-gzip");
    });

});


describe.sequential("getRepoList", context => {

    it("correctly lists a repo non recursively", async() => {

        const owner = "octocat";
        const repo = "octocat.github.io";

        const outputStream = { write: sinon.fake() };

        // @ts-expect-error testing
        const ghe = new GithubExtractor({ owner, repo, outputStream });

        await ghe.getRepoList({ dest: TEST_TEMP_DIR, recursive: true });

        sinon.assert.calledWith(outputStream.write, "params.json\n");
        sinon.assert.calledWith(outputStream.write, "javascripts/\n");

        sinon.assert.neverCalledWith(outputStream.write, "main.js\n");
        sinon.assert.neverCalledWith(outputStream.write, "blacktocat.png\n");
    });

    it("correctly lists a repo recursively", async() => {

        const owner = "octocat";
        const repo = "octocat.github.io";

        const outputStream = { write: sinon.fake() };

        // @ts-expect-error testing
        const ghe = new GithubExtractor({ owner, repo, outputStream });

        await ghe.getRepoList({ dest: TEST_TEMP_DIR, recursive: true });

        sinon.assert.calledWith(outputStream.write, "images/icon_download.png\n");
        sinon.assert.calledWith(outputStream.write, "stylesheets/github-light.css\n");

    });

    it("correctly returns cached list", async() => {

        const owner = "octocat";
        const repo = "Spoon-Knife";

        const outputStream = { write: sinon.fake() };

        // @ts-expect-error testing
        const ghe = new GithubExtractor({ owner, repo, outputStream });

        await ghe.getRepoList({ dest: TEST_TEMP_DIR });
        await ghe.getRepoList({ dest: TEST_TEMP_DIR });

        // @ts-expect-error testing
        sinon.assert.calledOnceWithMatch(request, `https://codeload.github.com/${ owner }/${ repo }/tar.gz/main`);

        expect(ghe["repoList"]).toStrictEqual([
            { filePath: "README.md", conflict: false },
            { filePath: "index.html", conflict: false },
            { filePath: "styles.css", conflict: false },
        ]);
    });


    it("correctly lists a repo when there are conflicts in the main repo", async() => {

        const owner = "octocat";
        const repo = "Spoon-Knife";

        fs.writeFileSync(`${ TEST_TEMP_DIR }/README.md`, "test");

        const outputStream = { write: sinon.fake() };

        // @ts-expect-error testing
        const ghe = new GithubExtractor({ owner, repo, outputStream });

        const fakeWriteListItem = sinon.fake();
        ghe["writeListItem"] = fakeWriteListItem;

        await ghe.getRepoList({ dest: TEST_TEMP_DIR });

        // @ts-expect-error testing
        sinon.assert.calledOnceWithMatch(request, `https://codeload.github.com/${ owner }/${ repo }/tar.gz/main`);

        sinon.assert.calledThrice(fakeWriteListItem);

        expect(fakeWriteListItem.firstCall.args[0]).toStrictEqual({ filePath: "README.md", conflict: true });
        expect(fakeWriteListItem.secondCall.args[0]).toStrictEqual({ filePath: "index.html", conflict: false });
        expect(fakeWriteListItem.thirdCall.args[0]).toStrictEqual({ filePath: "styles.css", conflict: false });

    });

    it("correctly only shows the conflicts when there are conflicts and conflictsOnly = true", async() => {

        const owner = "octocat";
        const repo = "Spoon-Knife";

        fs.writeFileSync(`${ TEST_TEMP_DIR }/README.md`, "test");

        const outputStream = { write: sinon.fake() };

        // @ts-expect-error testing
        const ghe = new GithubExtractor({ owner, repo, outputStream });

        const fakeWriteListItem = sinon.fake();
        ghe["writeListItem"] = fakeWriteListItem;

        await ghe.getRepoList({ dest: TEST_TEMP_DIR, conflictsOnly: true });

        // @ts-expect-error testing
        sinon.assert.calledOnceWithMatch(request, `https://codeload.github.com/${ owner }/${ repo }/tar.gz/main`);

        sinon.assert.calledOnceWithExactly(fakeWriteListItem, { filePath: "README.md", conflict: true });

    });

    it("correctly only shows the conflicts when there are conflicts and conflictsOnly = true", async() => {

        const owner = "octocat";
        const repo = "Spoon-Knife";

        fs.writeFileSync(`${ TEST_TEMP_DIR }/README.md`, "test");

        const outputStream = { write: sinon.fake() };

        // @ts-expect-error testing
        const ghe = new GithubExtractor({ owner, repo, outputStream });

        const fakeWriteListItem = sinon.fake();
        ghe["writeListItem"] = fakeWriteListItem;

        await ghe.getRepoList({ dest: TEST_TEMP_DIR, conflictsOnly: true });

        // @ts-expect-error testing
        sinon.assert.calledOnceWithMatch(request, `https://codeload.github.com/${ owner }/${ repo }/tar.gz/main`);

        sinon.assert.calledOnceWithExactly(fakeWriteListItem, { filePath: "README.md", conflict: true });

    });

    it("correctly shows nothing when there no conflicts and conflictsOnly = true", async() => {

        const owner = "octocat";
        const repo = "Spoon-Knife";

        const outputStream = { write: sinon.fake() };

        // @ts-expect-error testing
        const ghe = new GithubExtractor({ owner, repo, outputStream });

        const fakeWriteListItem = sinon.fake();
        ghe["writeListItem"] = fakeWriteListItem;

        await ghe.getRepoList({ dest: TEST_TEMP_DIR, conflictsOnly: true });

        // @ts-expect-error testing
        sinon.assert.calledOnceWithMatch(request, `https://codeload.github.com/${ owner }/${ repo }/tar.gz/main`);

        sinon.assert.notCalled(fakeWriteListItem);

    });

    
});


describe.sequential("downloadTo", context => {

    it("downloads the repo correctly", async() => {

        const owner = "octocat";
        const repo = "Spoon-Knife";

        const ghe = new GithubExtractor({ owner, repo });

        await ghe.downloadTo({ dest: TEST_TEMP_DIR });

        expect(fs.existsSync(`${ TEST_TEMP_DIR }/README.md`)).toBe(true);
        expect(fs.existsSync(`${ TEST_TEMP_DIR }/index.html`)).toBe(true);
        expect(fs.existsSync(`${ TEST_TEMP_DIR }/styles.css`)).toBe(true);
    });


    it("correctly gets selected files and returns an empty array when there are no typos", async() => {

        const owner = "SCons";
        const repo = "scons-examples";

        const selectedPath = "simple-variant-dir/src/app/SConscript";

        const nonSelected = "shared-lib-program/app.c";

        const ghe = new GithubExtractor({ 
            owner, 
            repo,
            selectedPaths: new Set([selectedPath]),
        });

        const typos = await ghe.downloadTo({ dest: TEST_TEMP_DIR });

        expect(fs.existsSync(`${ TEST_TEMP_DIR }/${ selectedPath }`)).toBe(true);
        expect(fs.existsSync(`${ TEST_TEMP_DIR }/${ nonSelected }`)).toBe(false);

        expect(typos).toStrictEqual([]);
    });

    it("correctly ignores non matching cased paths when caseInsensitive is false", async() => {

        const owner = "SCons";
        const repo = "scons-examples";

        const selectedPath = "simple-variant-dir/src/app/SCONSCRIPT";

        const ghe = new GithubExtractor({ 
            owner, 
            repo,
            caseInsensitive: false,
            selectedPaths: new Set([selectedPath]),
        });

        await ghe.downloadTo({ dest: TEST_TEMP_DIR });

        expect(fs.existsSync(`${ TEST_TEMP_DIR }/${ selectedPath }`)).toBe(false);
    });

    it("correctly selects non matching cased paths when caseInsensitive is true", async() => {

        const owner = "SCons";
        const repo = "scons-examples";

        const selectedPath = "simple-variant-dir/src/app/SCONSCRIPT";

        const ghe = new GithubExtractor({ 
            owner, 
            repo,
            caseInsensitive: true,
            selectedPaths: new Set([selectedPath]),
        });

        await ghe.downloadTo({ dest: TEST_TEMP_DIR });

        expect(fs.existsSync(`${ TEST_TEMP_DIR }/${ selectedPath }`)).toBe(true);
    });

    it("Correctly handles a non tar body", async() => {

        const owner = "none";
        const repo = "none";

        const selectedPath = "simple-variant-dir/src/app/SCONSCRIPT";

        const ghe = new GithubExtractor({ 
            owner, 
            repo,
            caseInsensitive: true,
            selectedPaths: new Set([selectedPath]),
        });

        
        const readable = Readable.from(['test']);

        const getTarBodyFake = sinon.fake.resolves({
            statusCode: 404,
            body: readable,
            headers: {
                "content-type": "text/plain",
            },
        });

        ghe["getTarBody"] = getTarBodyFake;

        await expect(ghe.downloadTo({ dest: TEST_TEMP_DIR })).rejects.toThrow(/TAR_BAD_ARCHIVE/);

    });

    // typos

});

