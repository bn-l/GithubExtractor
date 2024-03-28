
<div align="center">
    <img src="./images/header.png" alt="header logo: Github Extractor" width="50%" height="50%">
</div>

List github repositories and download individual files or whole repos. ~200% faster than clone depth=1 for an entire repo and much, much faster if you just need a single file.

<div align="center">
<img src="https://github.com/bn-l/GithubExtractor/actions/workflows/ci.yml/badge.svg" alt="Continuous Integration status badge">   <a href="./coverage/coverage.txt"><img src="./images/coverage-badge.svg" alt="Code coverage badge"></a>  <a href="https://github.com/bn-l/GithubExtractor/issues"><img src="https://img.shields.io/github/issues/bn-l/GithubExtractor" alt="GitHub issues badge"></a>  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com" alt="Pull requests welcome badge">
</div>

## Install

```bash
npm install github-extractor
```

## Usage 

### Initialize
```typescript
import githubExtractor from "github-extractor";

const ghe = new githubExtractor({
    owner: "octocat",
    repo: "Spoon-Knife",
    // The default: Readme.md is a different file to README.md
    caseInsensitive: false, 
})
```

### List

 ```typescript
 const fullList = await ghe.list();
 
 // List a repo non recursively to only show the top-level items (recursive is true by default):
 const topLevel = await ghe.list({ recursive: false }); 
 
 // Show any conflicts that might arise if downloading to `dest`:
 const conflicts = await ghe.list({ dest: "some/path", conflictsOnly: true });
    
 ```

### Download

```typescript
await ghe.downloadTo({ dest: "some/path" });
```

Using `selectedPaths`:
Downloads only the paths in the repo specified. Do not prefix with repo name. It will 
stop downloading once it has the file. This can make getting a single file from a large 
repo very fast.

```typescript
// Save just `boo.jpg`:
await ghe.downloadTo({ dest: "some/path", selectedPaths: ["someFolder/boo.jpg"] });

// just the `README.md` file: 
await ghe.downloadTo({ dest: "some/path", selectedPaths: ["README.md"] });
   
```


There are more options and they're all documented using jsdoc so will appear in intellisense. 



