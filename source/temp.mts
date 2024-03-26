import githubExtractor from "./index.mjs";


const ghe = new githubExtractor({
    owner: "octocat",
    repo: "Spoon-Knife",
    caseInsensitive: true,
});
