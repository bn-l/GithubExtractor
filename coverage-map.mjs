
import fs from "fs";
import test from "node:test";
import path from "path";

const SOURCE_DIR = "source";

// export default (testFile) => {
//     const original = testFile;
//     const sourceFiles = fs.readdirSync("./source", {recursive: true})
//         .map(filePath => SOURCE_DIR + "/" + filePath);
//     testFile = testFile.replace(/^tests/, "source");
//     testFile = testFile.replace(/\.test/, "");
//     if (!sourceFiles.includes(testFile)) {
//         throw Error(`Matching source file for ${original} not found. Tried looking for: ${testFile})`);
//     }
//     return testFile;
// }

// export default (testFile) => {
//     return testFile.replace(/^tests/, 'source').replace(/\.test/, "");
// }


export default (testFile) => testFile.replace(/^tests/, 'source').replace(/\.test/, "");