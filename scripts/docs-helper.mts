import fsp from "node:fs/promises";
import GithubExtractor from "../source/index.mts";
import pathe from "pathe";

await fsp.cp("./media", "./docs/public", { recursive: true });

console.log("Copied ./media to ./docs/public");

const dest = "./docs/";
const cliReadmeFileName = "README.md";
const cliReadmeSvgFileName = "media/ghex-svg-cat.svg"

const ghe = new GithubExtractor({
    owner: "bn-l",
    repo: "GithubExtractorCLI"
});

await ghe.downloadTo({dest, selectedPaths: [cliReadmeFileName, cliReadmeSvgFileName]});

const readmeFilePath = pathe.resolve("./docs/README.md");
const docsFilePath = pathe.resolve("./docs/cli.md");

const readmeFile = await fsp.readFile(readmeFilePath, {encoding: "utf-8"});

const snipped = readmeFile.split("<!-- ABOVE SNIP -->")[1];

await fsp.writeFile(readmeFilePath, snipped, {encoding: "utf-8"});

await fsp.rename(readmeFilePath, docsFilePath);

console.log(`Wrote ${docsFilePath}`);

