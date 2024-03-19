
import t from 'tap'

import { GithubExtractor } from "../source/GithubExtractor.mjs";

// use octocat repo

const TEST_OWNER = "octocat";
const TEST_REPO = "Spoon-Knife";

// constructed correctly given various params.

// Methods:
// ----------
// Standard (test by indexing name)
// ----------


t.only("constructs an instance", async t => {
    
    t.doesNotThrow(() => new GithubExtractor({
        owner: TEST_OWNER,
        repo: TEST_REPO
    }));
});

// --------------- normalizeTarPath ----------------------

t.test("normalizeTarPath: removes leading folder name", async t => {
    const ghe = new GithubExtractor({
        owner: TEST_OWNER,
        repo: TEST_REPO
    });
    t.equal(ghe["normalizeTarPath"]("Spoon-Knife-1.0.0/README.md"), "README.md");
});

t.test("normalizeTarPath removes the leading slash if present and that's it", async t => {
    const ghe = new GithubExtractor({
        owner: TEST_OWNER,
        repo: TEST_REPO
    });
    t.equal(ghe["normalizeTarPath"]("/Spoon-Knife-1.0.0/README.md"), "Spoon-Knife-1.0.0/README.md");
});

t.test("normalizeTarPath: converts everything to lower case if caseInsensitive is true", async t => {
    const ghe = new GithubExtractor({
        owner: TEST_OWNER,
        repo: TEST_REPO,
        caseInsensitive: true
    });
    t.equal(ghe["normalizeTarPath"]("README.md"), "readme.md");
});

t.test("normalizeTarPath: does nothing if caseInsensitive is false and there's not slashes or whitespace", async t => {
    const ghe = new GithubExtractor({
        owner: TEST_OWNER,
        repo: TEST_REPO,
        caseInsensitive: false
    });
    t.equal(ghe["normalizeTarPath"]("README.md"), "README.md");
});

t.test("normalizeTarPath: removes whitespace", async t => {
    const ghe = new GithubExtractor({
        owner: TEST_OWNER,
        repo: TEST_REPO
    });
    t.equal(
        ghe["normalizeTarPath"]("  	 folder/README.md     "), 
    "folder/README.md"
    );
});

t.test("normalizePathSet: does not work with windows paths", async t => {
    const ghe = new GithubExtractor({
        owner: TEST_OWNER,
        repo: TEST_REPO
    });
    t.equal(ghe["normalizeTarPath"]("something\\README.md"), "something\\README.md");
});

// --------------- normalizeFilePath ----------------------

t.test("normalizeFilePath: does nothing if caseInsensitive is false and there's no whitespace", async t => {
    const ghe = new GithubExtractor({
        owner: TEST_OWNER,
        repo: TEST_REPO,
        caseInsensitive: false
    });
    t.equal(ghe["normalizeFilePath"]("README.md"), "README.md");
});

t.test("normalizeFilePath: converts everything to lower case if caseInsensitive is true", async t => {
    const ghe = new GithubExtractor({
        owner: TEST_OWNER,
        repo: TEST_REPO,
        caseInsensitive: true
    });
    t.equal(ghe["normalizeFilePath"]("README.md"), "readme.md");
});

t.test("normalizeFilePath: removes whitespace", async t => {
    const ghe = new GithubExtractor({
        owner: TEST_OWNER,
        repo: TEST_REPO
    });
    t.equal(ghe["normalizeFilePath"]("  	 folder/README.md     "), "folder/README.md");
});

// --------------- normalizePathSet ----------------------

t.test("normalizePathSet: converts all files to lower case if caseInsensitive is true", async t => {
    const filePathSet = new Set(["README.md", "LICENSE", "folder/README.md"]);
    const ghe = new GithubExtractor({
        owner: TEST_OWNER,
        repo: TEST_REPO,
        caseInsensitive: true
    });
    t.same(ghe["normalizePathSet"](filePathSet), new Set(["readme.md", "license", "folder/readme.md"]));
});

t.test("normalizePathSet: does nothing if caseInsensitive is false", async t => {
    const filePathSet = new Set(["README.md", "LICENSE", "folder/README.md"]);
    const ghe = new GithubExtractor({
        owner: TEST_OWNER,
        repo: TEST_REPO,
        caseInsensitive: false
    });
    t.same(ghe["normalizePathSet"](filePathSet), filePathSet);
});


// --------------- handleBadResponse ----------------------

// rename this file to name.unit.test.mts
//  test the functions below in name.test.mts or their own file completely

// handleBadResponse -- Test indirectly 
  
// makeRequest
// ghetTarBody
// handleTypos
// downloadTo
// getLocalDirContents -- Small unit tests like above with mock dir
// writeListItem
// getRepoList

// Other:
// -----------
// test that list and download produce the same result


