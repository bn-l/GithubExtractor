
import fs from "node:fs";
import path from "path";


export function getSelectedPaths(
    { tempDir, selectedPaths, owner, repo, dest, defaultBranch }: 
    { dest: string; owner: string; repo: string; selectedPaths: string[]; tempDir: string, defaultBranch: string } 
) {
    
    let tempDirPaths: string[] = [];
    const tempRepoDir = path.join(tempDir, `${ repo }-${ defaultBranch }`);

    try {
        tempDirPaths = fs.readdirSync(tempDir);
    }
    catch (error) {
        // @ts-expect-error no guard
        if (error.code !== "ENOENT") {
            throw error;
        }
    }

    const missing: string[] = [];

    for (const filePath in selectedPaths) {
        if (!tempDirPaths.includes(filePath)) {
            missing.push(filePath);
        }
    }

    if missing.length
}
