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

***

### prefix?

```ts
optional prefix: string;
```

A prefix to add to output. Default is nothing.

***

### suffix?

```ts
optional suffix: string;
```

Suffix to add to the output. Defaults to a new line
