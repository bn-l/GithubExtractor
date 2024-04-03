import fs from "node:fs";
import GithubExtractor from "../source/index.mts";
import pathe from "pathe";

fs.cpSync("./media", "./docs/public", { recursive: true });

console.log("Copied ./media to ./docs/public");


const dest = "./docs/";
const filename = "README.md";

const ghe = new GithubExtractor({
    owner: "bn-l",
    repo: "GithubExtractorCLI"
});
await ghe.downloadTo({dest, selectedPaths: [filename]});

fs.renameSync("./docs/README.md", "./docs/cli.md");

console.log(`Wrote ${pathe.resolve("../docs/cli.md")}`);

