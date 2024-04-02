/**
 * default export and entry point
 * @module
 */

export type {
    DownloadToOptions,
    GithubExtractorOptions,
    ListOptions,
    ListStreamOptions,
    ListItem,
    Typo,
    GithubExtractor
} from "./GithubExtractor.mjs";

export {
    FetchError,
    FileConflictError,
    MissingInJSONError
} from "./custom-errors.mjs";

export { GithubExtractor as default } from "./GithubExtractor.mjs";
