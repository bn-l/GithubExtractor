[github-extractor](../../index.md) / [GithubExtractor](../index.md) / ListStreamOptions

# ListStreamOptions

## Properties

### highlightConflicts?

```ts
optional highlightConflicts: boolean;
```

Whether to use ascii escape characters to highlight conflicts when writing to the
 outputStream.

#### Default

```ts
true
```

#### Source

[source/GithubExtractor.mts:57](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/GithubExtractor.mts#L57)

***

### newLine?

```ts
optional newLine: boolean;
```

Include new line at the end of each listed repo path.

#### Default

```ts
true
```

#### Source

[source/GithubExtractor.mts:62](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/GithubExtractor.mts#L62)

***

### outputStream?

```ts
optional outputStream: WritableStream;
```

The stream to write the repo paths to for visual output as the list is being created.
 by default it will write to the console.

#### Default

```ts
process.stdout
```

#### Source

[source/GithubExtractor.mts:51](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/GithubExtractor.mts#L51)
