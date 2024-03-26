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

import { request, MockAgent, setGlobalDispatcher, } from "undici";
import fs from "node:fs";

import { Readable } from "node:stream";
// import { SerializableErrror } from "tar"


const TEMP_DIR = "./test/fixtures/TEMP_DIR";

const mockAgent = new MockAgent();
mockAgent.disableNetConnect();
setGlobalDispatcher(mockAgent);
const mockPool = mockAgent.get("https://codeload.github.com");

const redirectPool = mockAgent.get("https://github.com");


// !! create real online test that tests redirect
// !! Remove sequential / delays from this`

const addRepoIntercept = () => {
    mockPool.intercept({
        path: "/bn-l/repo/tar.gz/main",
        method: "GET",
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        }
    }).reply(200, 
        fs.readFileSync("./test/fixtures/repo-main.tar.gz"),
        { 
            headers: { 
                "content-type": "application/x-gzip",
            } 
        }
    );
}
// * Testing redirect

const addRedirectIntercept = () => {
    mockPool.intercept({
        path: "/bn-l/repo2/tar.gz/main",
        method: "GET",
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        }
    }).reply(404);
    redirectPool.intercept({

        path: "/bn-l/repo2/archive/refs/heads/master.tar.gz",
        method: "GET",
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        }
    }).reply(302, undefined, {
        headers: {
            'Location': 'https://codeload.github.com/bn-l/repo2/tar.gz/master'
        }
    });
    mockPool.intercept({
        path: "/bn-l/repo2/tar.gz/master",
        method: "GET",
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        }
    }).reply(200,
        fs.readFileSync("./test/fixtures/repo-main.tar.gz"),
        { 
            headers: { 
                "content-type": "application/x-gzip",
            } 
        }
    );
}


beforeAll(() => {
    // sinon.restore();
    // vi.restoreAllMocks();
    fs.mkdirSync(TEMP_DIR, { recursive: true });
});

beforeEach(async() => {
    // await new Promise((res) => setTimeout(res, Math.random() * 1000));

    fs.rmSync(TEMP_DIR, { recursive: true });
    fs.mkdirSync(TEMP_DIR, { recursive: true });

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




describe.sequential("getTarBody", context => {

    it("gets the tar immediately if the default branch is main", async() => {

        addRepoIntercept();

        const owner = "bn-l";
        const repo = "repo" // main default branch

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

        addRedirectIntercept();

        const owner = "bn-l";
        const repo = "repo2" // master default branch

        const ghe = new GithubExtractor({ owner, repo });

        const res = await ghe["getTarBody"]();

        // @ts-expect-error testing
        sinon.assert.calledTwice(request);
    
        expect(res.statusCode).toBe(200);
        expect(res.headers["content-type"]).toBe("application/x-gzip");
    });

});


describe.sequential("getRepoList", context => {

    it("returns a repo list", async() => {

        addRepoIntercept();

        const owner = "bn-l";
        const repo = "repo"

        const outputStream = { write: sinon.fake() };

        const ghe = new GithubExtractor({ owner, repo });
        
        // @ts-expect-error testing
        const list = await ghe.getRepoList({ dest: TEMP_DIR, recursive: true, outputStream });

        expect(list).toHaveLength(4);
        expect(list).to.have.deep.members([
            { filePath: "somefile.txt", conflict: false },
            { filePath: "somefolder/", conflict: false },
            { filePath: "README.md", conflict: false },
            { filePath: "somefolder/yoohoo.html", conflict: false },
        ]);
    });

    it("returns a repo list when given no arguments", async() => {

        addRepoIntercept();

        const owner = "bn-l";
        const repo = "repo"

        const ghe = new GithubExtractor({ owner, repo });

        const list = await ghe.getRepoList();

        expect(list).toHaveLength(4);
        expect(list).to.have.deep.members([
            { filePath: "somefile.txt", conflict: false },
            { filePath: "somefolder/", conflict: false },
            { filePath: "README.md", conflict: false },
            { filePath: "somefolder/yoohoo.html", conflict: false },
        ]);
    });

    it("lists a repo non recursively", async() => {

        addRepoIntercept();

        const owner = "bn-l";
        const repo = "repo"

        const ghe = new GithubExtractor({ owner, repo });
        
        const streamOptions = { outputStream: { write: sinon.fake() } };
        const write = streamOptions.outputStream.write;

        // @ts-expect-error testing
        await ghe.getRepoList({ dest: TEMP_DIR, recursive: false, streamOptions });

        sinon.assert.calledWithExactly(write, "README.md\n");
        sinon.assert.calledWithExactly(write, "somefile.txt\n");
        sinon.assert.calledWithExactly(write, "somefolder/\n");
        sinon.assert.neverCalledWith(write, "somefolder/yoohoo.html\n");

    });

    it("lists a repo recursively", async() => {

        addRepoIntercept();

        const owner = "bn-l";
        const repo = "repo"

        const streamOptions = { outputStream: { write: sinon.fake() } };
        const write = streamOptions.outputStream.write;

        const ghe = new GithubExtractor({ owner, repo });
        
        // @ts-expect-error testing
        await ghe.getRepoList({ dest: TEMP_DIR, recursive: true, streamOptions });

        sinon.assert.calledWithExactly(write, "README.md\n");
        sinon.assert.calledWithExactly(write, "somefile.txt\n");
        sinon.assert.calledWithExactly(write, "somefolder/yoohoo.html\n");
    });

    it("lists a repo, showing conflicts, when there are conflicts in the main repo, and recursive = true", async() => {

        addRepoIntercept();

        const owner = "bn-l";
        const repo = "repo"

        fs.writeFileSync(`${ TEMP_DIR }/README.md`, "test");
        fs.mkdirSync(`${ TEMP_DIR }/somefolder/`);
        fs.writeFileSync(`${ TEMP_DIR }/somefolder/yoohoo.html`, "test");

        const streamOptions = { outputStream: { write: sinon.fake() }, highlightConflicts: false };
        
        const ghe = new GithubExtractor({ owner, repo });
        
        const fakeWriteListItem = sinon.fake();
        ghe["writeListStream"] = fakeWriteListItem;

        // @ts-expect-error testing
        await ghe.getRepoList({ dest: TEMP_DIR, streamOptions, recursive: true });

        // @ts-expect-error testing
        sinon.assert.calledOnceWithMatch(request, `https://codeload.github.com/${ owner }/${ repo }/tar.gz/main`);

        sinon.assert.callCount(fakeWriteListItem, 4);

        const receivedListItems = fakeWriteListItem.args.map(([args]) => args.listItem);

        expect(receivedListItems).toHaveLength(4);

        expect(receivedListItems).to.have.deep.members([
            { filePath: "README.md", conflict: true }, 
            { filePath: "somefolder/", conflict: true }, 
            { filePath: "somefolder/yoohoo.html", conflict: true }, 
            { filePath: "somefile.txt", conflict: false, },
        ]);

    });

    it("shows only the conflicts when there are conflicts and conflictsOnly = true", async() => {

        addRepoIntercept();

        const owner = "bn-l";
        const repo = "repo"

        fs.writeFileSync(`${ TEMP_DIR }/README.md`, "test");

        const streamOptions = { outputStream: { write: sinon.fake() }, highlightConflicts: true };

        const ghe = new GithubExtractor({ owner, repo });

        const fakeWriteListItem = sinon.fake();
        ghe["writeListStream"] = fakeWriteListItem;

        // @ts-expect-error testing
        await ghe.getRepoList({ dest: TEMP_DIR, conflictsOnly: true, streamOptions, recursive: false });

        // @ts-expect-error testing
        sinon.assert.calledOnceWithMatch(request, `https://codeload.github.com/${ owner }/${ repo }/tar.gz/main`);

        sinon.assert.calledOnceWithExactly(fakeWriteListItem, { listItem: { filePath: "README.md", conflict: true }, streamOptions });

    });

    it("shows nothing when there no conflicts and conflictsOnly = true", async() => {

        addRepoIntercept();

        const owner = "bn-l";
        const repo = "repo"

        const streamOptions = { outputStream: { write: sinon.fake() }, highlightConflicts: true };

        const ghe = new GithubExtractor({ owner, repo });
        
        const fakeWriteListItem = sinon.fake();
        ghe["writeListStream"] = fakeWriteListItem;
        
        // @ts-expect-error testing
        await ghe.getRepoList({ dest: TEMP_DIR, conflictsOnly: true, streamOptions });

        // @ts-expect-error testing
        sinon.assert.calledOnceWithMatch(request, `https://codeload.github.com/${ owner }/${ repo }/tar.gz/main`);

        sinon.assert.notCalled(fakeWriteListItem);

    });

    
});


describe.sequential("downloadTo", context => {

    it("downloads the repo", async() => {

        addRepoIntercept();

        const owner = "bn-l";
        const repo = "repo"

        const ghe = new GithubExtractor({ owner, repo });

        await ghe.downloadTo({ dest: TEMP_DIR });

        expect(fs.existsSync(`${ TEMP_DIR }/README.md`)).toBe(true);
        expect(fs.existsSync(`${ TEMP_DIR }/somefolder/yoohoo.html`)).toBe(true);
        expect(fs.existsSync(`${ TEMP_DIR }/somefile.txt`)).toBe(true);
    });


    it("correctly gets selected files and returns an empty array when there are no typos", async() => {

        addRepoIntercept();

        const owner = "bn-l";
        const repo = "repo"

        const selectedPath = "somefolder/yoohoo.html";

        const nonSelected = "somefile.txt";

        const ghe = new GithubExtractor({ owner, repo });

        const typos = await ghe.downloadTo({ dest: TEMP_DIR, selectedPaths: [selectedPath]});

        expect(fs.existsSync(`${ TEMP_DIR }/${ selectedPath }`)).toBe(true);
        expect(fs.existsSync(`${ TEMP_DIR }/${ nonSelected }`)).toBe(false);

        expect(typos).toStrictEqual([]);
    });

    it("correctly shows the typos in selected files", async() => {

        addRepoIntercept();

        const owner = "bn-l";
        const repo = "repo"

        const selectedPath = "somefolder/YeewHew.html";

        const nonSelected = "somefile.txt";

        const ghe = new GithubExtractor({ owner, repo });

        const typos = await ghe.downloadTo({ dest: TEMP_DIR, selectedPaths: [selectedPath]});

        expect(fs.existsSync(`${ TEMP_DIR }/${ selectedPath }`)).toBe(false);
        expect(fs.existsSync(`${ TEMP_DIR }/${ nonSelected }`)).toBe(false);

        expect(typos).toStrictEqual([
            ["somefolder/YeewHew.html", "somefolder/yoohoo.html"]
        ]);
    });

    it("correctly ignores non matching cased paths when caseInsensitive is false", async() => {

        addRepoIntercept();

        const owner = "bn-l";
        const repo = "repo"

        const selectedPath = "SOMEFoLdEr/YOOHOO.html";

        const ghe = new GithubExtractor({ owner, repo, caseInsensitive: false });

        await ghe.downloadTo({ dest: TEMP_DIR, selectedPaths: [selectedPath] });

        expect(fs.existsSync(`${ TEMP_DIR }/${ selectedPath }`)).toBe(false);
    });

    it("correctly selects non matching cased paths when caseInsensitive is true", async() => {

        addRepoIntercept();

        const owner = "bn-l";
        const repo = "repo"

        const selectedPath = "SOMEFoLdEr/YOOHOO.html";

        const ghe = new GithubExtractor({ owner, repo, caseInsensitive: true });

        await ghe.downloadTo({ dest: TEMP_DIR, selectedPaths: [selectedPath] });

        expect(fs.existsSync(`${ TEMP_DIR }/${ selectedPath }`)).toBe(true);
    });

    it("Correctly handles a non tar body", async() => {

        addRepoIntercept();

        const owner = "none";
        const repo = "repo"

        const ghe = new GithubExtractor({ owner, repo });

        const readable = Readable.from(['test']);

        const getTarBodyFake = sinon.fake.resolves({
            statusCode: 404,
            body: readable,
            headers: {
                "content-type": "text/plain",
            },
        });

        ghe["getTarBody"] = getTarBodyFake;

        await expect(ghe.downloadTo({ dest: TEMP_DIR })).rejects.toThrow(/TAR_BAD_ARCHIVE/);

    });

    it("produces the same results as getRepoList", async() => {
            
        addRepoIntercept();

        const owner = "bn-l";
        const repo = "repo"

        const ghe = new GithubExtractor({ owner, repo });

        const list = await ghe.getRepoList({ dest: TEMP_DIR, recursive: true });
        const listFileNames = list.map(({ filePath }) => filePath);

        fs.rmSync(TEMP_DIR, { recursive: true });
        fs.mkdirSync(TEMP_DIR, { recursive: true });

        await ghe.downloadTo({ dest: TEMP_DIR });

        const dirContents = await ghe.getLocalDirSet(TEMP_DIR);

        expect([...dirContents]).to.have.all.members(listFileNames);
    
    });

});
