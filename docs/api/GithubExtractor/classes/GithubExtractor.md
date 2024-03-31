[github-extractor](../../index.md) / [GithubExtractor](../index.md) / GithubExtractor

# GithubExtractor

The main class

## Constructors

### new GithubExtractor(options)

```ts
new GithubExtractor(options): GithubExtractor
```

#### Parameters

• **options**: [`GithubExtractorOptions`](../interfaces/GithubExtractorOptions.md)

Main class constructor options.

#### Returns

[`GithubExtractor`](GithubExtractor.md)

## Properties

### caseInsensitive

```ts
caseInsensitive: undefined | boolean;
```

***

### owner

```ts
owner: string;
```

***

### repo

```ts
repo: string;
```

## Methods

### downloadTo()

```ts
downloadTo(options): Promise<Typo[]>
```

Download a repo to a certain location (`dest`)

#### Parameters

• **options**: [`DownloadToOptions`](../interfaces/DownloadToOptions.md)

#### Returns

`Promise`\<[`Typo`](../type-aliases/Typo.md)[]\>

- An empty array if all `selectedPaths` were found / there were no `selectedPaths`
 given OR an array of possible typos if some of the `selectedPaths` were not found.

#### Example

Basic usage:
```typescript
await ghe.downloadTo({ dest: "some/path" });
```
To only download some paths: \
Do not prefix path with repo name. It will stop downloading once it has the file 
(this can make getting a single file from a large repo very fast).

```typescript
// Save just `boo.jpg`:
await ghe.downloadTo({ dest: "some/path", selectedPaths: ["someFolder/boo.jpg"] });

// just the `README.md` file: 
await ghe.downloadTo({ dest: "some/path", selectedPaths: ["README.md"] });
   
```

***

### getLocalDirSet()

```ts
getLocalDirSet(dir, recursive): Promise<Set<string>>
```

Get a set of the contents of a directory, sorted using using string.localeCompare (with 
directories listed first).
all paths are converted to posix and are relative to the given dir.

#### Parameters

• **dir**: `string`

• **recursive**: `boolean`= `true`

default true

#### Returns

`Promise`\<`Set`\<`string`\>\>

***

### list()

```ts
list(options): Promise<ListItem[]>
```

Returns a list of files in the repo and writes to (by default) stdout (console.log). Supply
an object with options to change defaults.

#### Parameters

• **options**: [`ListOptions`](../interfaces/ListOptions.md)= `{}`

#### Returns

`Promise`\<[`ListItem`](../interfaces/ListItem.md)[]\>

#### Example

```typescript
const fullList = await ghe.list();

// List a repo non recursively to only show the top-level items:
const topLevel = await ghe.list({ recursive: false }); 

// Show any conflicts that might arise if downloading to `dest`:
const conflicts = await ghe.list({ dest: "some/path", conflictsOnly: true });
   
```
