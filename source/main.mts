
import temporaryDirectory from "temp-dir";

// name: github-dl
// bin: gdl
 

// Update:
// ------
// No cache and delete temp folder when finished with it

// Problematic dealing with copy, and tar extract is very fast.
// download method:
// Will only cache the tar and will check if it exists before downloading
// uses the dest property


// !! Saved as 

// cli:
// ----
// https://github.com/ and blob/{master,main} are removed automatically if found
//    first argument is then parsed:
// bin -u user/repo <-- first element of path is the user 
// bin user/repo/path/to/file (assumed everything after "repo" is a route to a file / dir)
// bin -ls repo
//     (critical!) will list files in repo/path/to/fileOrDir format so the result can
//      be piped back into the command. E.g.
//        github-dl -ls | fzf | github-dl
// -l: gets file list 
// -c: list conflicts (can use the listing function the list conflicts--no coloring)
// -l -c / -lc: List with conflicts warning (wraps conflicting files with chalk.red)
// -f filter (works with all options )

// Conflicts on extracting (i.e. when not using the -l option) will stop the app, list conflicts, and then ask for confirmation. If it takes up more than x amount of available space to list the conflicts then truncate with the total number and suggest running with -lc option.
// - when running non cli will return a status object with {status: "conflicts", data: conflicts}
// - set intersection to determine conflicts

// ! Use api for ent selection and tar for whole folder

// Filtering
// - Just pass arg to Regex (and fail and show error if it's not valid). split("/") to get body + flags. will only save files matching the filter. Use in node-tar filter function.

// Functions 
// List -- returns objects list with data including whether conflicts
// Extract -- 


// - let node-tar handle
//    writes and overwrites


// Todo:
// Separate select files function that first checks if the file exists in the default location.
// - Option to ignore overwrite warning (-i)
// - Access token support. See: https://github.com/isaacs/github/issues/554#issuecomment-778255274
//     and: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens

// - Use with fzf: `bin $(bin args | fzf)` 
// - First list archi
// - Pipe into function that has 
// - If there will be files overwritten, yield with list of files
//      "continue" method on generator will continue the extraction.

