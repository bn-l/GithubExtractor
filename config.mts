
import fs from "node:fs";
import { findUpSync } from "find-up";


export const regex = new RegExp(/{\^([^\^{}~\|]+)(~[^\^{}\|]+)?\^}/g);
export const checkRegex = new RegExp(/{\^.*?\^}/g);

export const config = {
    longName: "WEAPON",
    templateExtension: ".wpn",
    configFileName: ".wpn.config.yaml",
    shellFileName: "shell.wpn",
    templateYamlFileName: "wpn.yaml",
    smallFunctionChar: "=",
    templateLeft: "{^",
    templateRight: "^}",
    transformChar: "~",
    shellSpecifierChar: "#>",
    emptyShellReplacementSentinel: "<| EMPTY_REPLACEMENT_SENTINEL |>",
    arrow: "  ► ",
} as const;

const packageConfigProperties = [
    "name",
    "version",
    "description",
    "bin",
] as const;

function getPackageJson(): { [K in typeof packageConfigProperties[number]]: string } {

    const packagePath = findUpSync("package.json", { cwd: import.meta.url });

    if (!packagePath) throw new Error("Could not find package.json file");
    
    const modulePackageFile = fs.readFileSync(packagePath, "utf8");
    const packageJson = JSON.parse(modulePackageFile);
    const packageConfig = {} as { [key: string]: string };

    for (const property of packageConfigProperties) {
        if (property in packageJson) {
            packageConfig[property] = property === "bin" ? 
                Object.keys(packageJson.bin)[0] : 
                packageJson[property];
        }
        else {
            throw new Error(`Property "${ property }" is not in the package.json file`);
        }
    }

    return packageConfig as { [K in typeof packageConfigProperties[number]]: string };
}

export const packageJson = getPackageJson();
