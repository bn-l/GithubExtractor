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

Pass through options for the tar.extract stream.

***

### include?

```ts
optional include: RegExp;
```

Include everything matching the regular expression. To exclude use negated regex.

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
