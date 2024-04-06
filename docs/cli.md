

<div><img src="./media/ghex-svg-cat.svg" /></div>

## Quickstart CLI

Install [node](https://nodejs.org/en/download) then:

```bash
npx ghex -h
```

Or:

```bash
npm install -g ghex
```

## Usage


```bash
ghex [options] <paths...>
```

## Arguments

### paths

One or more paths to download. Can be a whole repo, or a 
folder or a file within it. Supports globs but the path 
should be quoted. To exclude use a negative glob ("!" at 
the beginning). Can mix paths from different repos 
(conflicts resolved left to right). A trailing slash means
a whole folder. Conflicting files are skipped by default.

## Options

### -l, --list 

List files. Useful as a dry run and with fzf. Does not
download. Will show show conflicts for the current working
directory or -d / --dest.

### -p, --prefix         

Append the owner/repo prefix to the path in list output. 
This is useful for feeding back into ghex.

### -c, --conflicts-only  

Only show conflicts when listing.

### -d, --dest (folder)   

Destination folder. Defaults to the current directory.

### -i, --case-insensitive      

Ignores case when checking for conflicts. Default is 
case-sensitive--i.e. casing matters.

### -f, --force

Overwrite all existing conflicting files. Default false.

### -e, --echo-paths        

After writing, outputs the path of each file plus a new line.
Useful for piping to other commands. Also sets -quiet &
--no-color.

### -s, --strip (number)

Strip the first n directories from paths. If a path doesn't 
have enough directories to strip, it's skipped.

### -q, --quiet    

No success or error messages.     

### --no-prefix    

Remove the owner/repo prefix from the path in list output

### --no-colors         

Strip ansi escape characters used to color output.
ghex respects the NO_COLOR env var if set also. 


## Downloading Examples:

Entire repo:
```bash             
npx ghex facebook/react
```
Specific folder:
```bash
npx ghex "facebook/react/packages/*"
```
Specify destination:
```bash
npx ghex -d local/dest facebook/react
```
Specific files
```bash
npx ghex facebook/react/.circleci/config.yml  facebook/react/.github/stale.yml
```
Different repos mixed together"
```bash
npx ghex facebook/react  micromatch/picomatch
```


### Listing Examples:

Only conflicts
```bash
npx ghex -lc -d local/dest  facebook/react
```
Specific folder
```bash
npx ghex -l "facebook/react/.circleci/*"
```


<!-- Everything after the snip is snipped off -->
<!-- SNIP -->