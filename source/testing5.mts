import { rimraf } from "rimraf";
import path from "node:path";


const p = path.resolve(".tmp/") + "/*";


console.log(p);

// await rimraf(p, { glob: true });

