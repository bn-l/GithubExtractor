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

    it("gets the tar immediately if the default branch is correct", async() => {

        const owner = "octocat";
        const repo = "Spoon-Knife";

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

    
    it("Makes a second call if the default branch is incorrect then gets that correctly", async() => {

        const owner = "rtyley";
        const repo = "small-test-repo";

        const ghe = new GithubExtractor({ owner, repo });

        const res = await ghe["getTarBody"]();

        // @ts-expect-error testing
        sinon.assert.calledTwice(request);
    
        expect(res.statusCode).toBe(200);
        expect(res.headers["content-type"]).toBe("application/x-gzip");
    });

});


describe.sequential("getRepoList", context => {

    it("correctly lists a repo", async() => {

        const owner = "octocat";
        const repo = "Spoon-Knife";

        const outputStream = { write: sinon.fake() };

        // @ts-expect-error testing
        const ghe = new GithubExtractor({ owner, repo, outputStream });

        await ghe.getRepoList({ dest: TEST_TEMP_DIR });

        // @ts-expect-error testing
        sinon.assert.calledOnceWithMatch(request, `https://codeload.github.com/${ owner }/${ repo }/tar.gz/main`);

        expect(outputStream.write.firstCall.args[0]).toBe("README.md\n");
        expect(outputStream.write.secondCall.args[0]).toBe("index.html\n");
        expect(outputStream.write.thirdCall.args[0]).toBe("styles.css\n");
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


    it("correctly gets selected files", async() => {

        const owner = "SCons";
        const repo = "scons-examples";

        const selectedPath = "simple-variant-dir/src/app/SConscript";

        const nonSelected = "shared-lib-program/app.c";

        const ghe = new GithubExtractor({ 
            owner, 
            repo,
            selectedPaths: new Set([selectedPath]),
        });

        await ghe.downloadTo({ dest: TEST_TEMP_DIR });

        expect(fs.existsSync(`${ TEST_TEMP_DIR }/${ selectedPath }`)).toBe(true);
        expect(fs.existsSync(`${ TEST_TEMP_DIR }/${ nonSelected }`)).toBe(false);
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

    it.only("correctly selects non matching cased paths when caseInsensitive is true", async() => {

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

});

