import githubExtractor from "./index.mjs";


const ghe = new githubExtractor({
    owner: "octocat",
    repo: "Spoon-Knife",
});

const list = await ghe.getRepoList();

// Only gets the top

await ghe.getRepoList({ }); 
