[github-extractor](../../index.md) / [GithubExtractor](../index.md) / ListOptions

# ListOptions

## Properties

### conflictsOnly?

```ts
optional conflictsOnly: boolean;
```

Only list repo files in conflict with dest

#### Default

```ts
false
```

***

### dest?

```ts
optional dest: string;
```

The destination directory for the repo's files. Used to detect conflicts
and must be set if any conflict option is set.

***

### include?

```ts
optional include: RegExp;
```

Include everything matching the regular expression. To exclude use negated regex.

***

### recursive?

```ts
optional recursive: boolean;
```

If false will only list files and folders in the top level. Useful for repos with many files.

#### Default

```ts
true
```

***

### streamOptions?

```ts
optional streamOptions: ListStreamOptions;
```

Options for the stream to write the repo paths to for visual output as the list is being created. By default it writes to the console.
