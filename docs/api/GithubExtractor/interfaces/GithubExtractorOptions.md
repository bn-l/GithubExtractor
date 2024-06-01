[github-extractor](../../index.md) / [GithubExtractor](../index.md) / GithubExtractorOptions

# GithubExtractorOptions

## Properties

### branch?

```ts
optional branch: string;
```

The github repo branch to get. Defaults to main then master.

***

### caseInsensitive?

```ts
optional caseInsensitive: boolean;
```

Whether to ignore casing in paths. Default is false so SomePath/someFile.js will be
different to SOMEPATH/somefile.js.

#### Default

```ts
false
```

***

### owner

```ts
owner: string;
```

E.g. "octocat" in https://github.com/octocat/Spoon-Knife

***

### repo

```ts
repo: string;
```

E.g. "Spoon-Knife" in https://github.com/octocat/Spoon-Knife
