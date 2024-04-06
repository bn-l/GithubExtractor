
# github-extractor

<div align="center">
    <img src="./media/logo-1024.webp" alt="header logo: Github Extractor" width="35%" height="35%">
</div>



List github repositories and download individual files or whole repos conveniently. Faster than clone depth=1 for an entire repo and much faster if you just need a single file. Also works on the [cli](https://github.com/bn-l/GithubExtractorCLI).

[Api Documentation](https://bn-l.github.io/GithubExtractor/api/GithubExtractor/)
 
<div align="center" style="display: flex; justify-content: center; gap: 10px;">
<img src="https://github.com/bn-l/GithubExtractor/actions/workflows/ci.yml/badge.svg" alt="Continuous Integration status badge">   <a href="coverage/coverage.txt"><img src="./media/coverage-badge.svg" alt="Code coverage badge"></a>  <a href="https://github.com/bn-l/GithubExtractor/issues"><img src="https://img.shields.io/github/issues/bn-l/GithubExtractor" alt="GitHub issues badge"></a>  <a href="https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request"> <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="Pull requests welcome badge"> </a>
</div>









# Quickstart

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
There is also the [api Documentation](https://bn-l.github.io/GithubExtractor/api/GithubExtractor/).



