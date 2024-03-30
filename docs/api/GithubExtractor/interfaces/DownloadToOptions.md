[github-extractor](../../index.md) / [GithubExtractor](../index.md) / DownloadToOptions

# DownloadToOptions

## Properties

### dest

```ts
dest: string;
```

Destination to download the files into. Warning: it will overwrite any existing files 
by default unless extractOptions are set.

#### Source

[source/GithubExtractor.mts:96](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/GithubExtractor.mts#L96)

***

### extractOptions?

```ts
optional extractOptions: Omit<ExtractOptions, 
  | "filter"
  | "cwd"
  | "strip"
  | "onentry"
| "C">;
```

Pass through options for the tar.extract stream.

#### Source

[source/GithubExtractor.mts:110](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/GithubExtractor.mts#L110)

***

### include?

```ts
optional include: RegExp;
```

Include everything matching the regular expression. To exclude use negated regex.

#### Source

[source/GithubExtractor.mts:106](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/GithubExtractor.mts#L106)

***

### selectedPaths?

```ts
optional selectedPaths: string[];
```

Will only download these paths.

#### Example

```ts
["README.md", ".github/workflows/ci.yml"]
```

#### Source

[source/GithubExtractor.mts:102](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/GithubExtractor.mts#L102)
