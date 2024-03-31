import fs from "node:fs";


fs.cpSync("./media", "./docs/media", { recursive: true });

console.log("Copied ./media to ./docs/public");
