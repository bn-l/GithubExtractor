[github-extractor](../../index.md) / [GithubExtractor](../index.md) / GithubExtractorOptions

# GithubExtractorOptions

## Properties

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

#### Source

[source/GithubExtractor.mts:40](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/GithubExtractor.mts#L40)

***

### owner

```ts
owner: string;
```

E.g. "octocat" in https://github.com/octocat/Spoon-Knife

#### Source

[source/GithubExtractor.mts:30](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/GithubExtractor.mts#L30)

***

### repo

```ts
repo: string;
```

E.g. "Spoon-Knife" in https://github.com/octocat/Spoon-Knife

#### Source

[source/GithubExtractor.mts:34](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/GithubExtractor.mts#L34)
