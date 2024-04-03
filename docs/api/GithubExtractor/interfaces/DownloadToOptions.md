[github-extractor](../../index.md) / [GithubExtractor](../index.md) / DownloadToOptions

# DownloadToOptions

## Properties

### dest

```ts
dest: string;
```

Destination to download the files into. Warning: it will overwrite any existing files 
by default unless extractOptions are set.

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

Pass through options for the tar.extract stream. Not very important
 but here for completeness.

***

### match?

```ts
optional match: RegExp;
```

Must match every regular expression if given. If [selectedPaths](DownloadToOptions.md#selectedpaths) is given, it 
will operate on selected only.

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
