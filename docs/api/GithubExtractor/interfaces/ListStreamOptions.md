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
