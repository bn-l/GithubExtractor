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

#### Source

[source/GithubExtractor.mts:75](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/GithubExtractor.mts#L75)

***

### dest?

```ts
optional dest: string;
```

The destination directory for the repo's files. Used to detect conflicts
and must be set if any conflict option is set.

#### Source

[source/GithubExtractor.mts:70](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/GithubExtractor.mts#L70)

***

### include?

```ts
optional include: RegExp;
```

Include everything matching the regular expression. To exclude use negated regex.

#### Source

[source/GithubExtractor.mts:88](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/GithubExtractor.mts#L88)

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

#### Source

[source/GithubExtractor.mts:80](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/GithubExtractor.mts#L80)

***

### streamOptions?

```ts
optional streamOptions: ListStreamOptions;
```

Options for the stream to write the repo paths to for visual output as the list is being created. By default it writes to the console.

#### Source

[source/GithubExtractor.mts:84](https://github.com/bn-l/GithubExtractor/blob/0fe9471/source/GithubExtractor.mts#L84)
