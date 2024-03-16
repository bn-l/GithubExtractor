
import { getRepo } from "./getRepo.mjs";

import { request } from "undici";
import fs from "node:fs";


interface GHTreeReponse {
    sha: string;
    tree: {
        mode: string;
        path: string;
        sha: string;
        size: number;
        type: string;
        url: string;
    }[];
    truncated: boolean;
    url: string;
}


export async function listRepo(
    { tempDir, owner, repo, defaultBranch }: 
    { defaultBranch: string; owner: string; repo: string; tempDir: string }
) {
    
    const endpoint = `https://api.github.com/repos/${ owner }/${ repo }/git/trees/${ defaultBranch }?recursive=1`;
    
    const { statusCode, headers, body } = await request(endpoint);
    const data = (await body.json()) as GHTreeReponse;

    const filePaths = new Set<string>();

    for (const ent of data.tree) {
        filePaths.add(`${ owner }/${ repo }/${ ent.path }`);
    }
    
    if (data.truncated) {
        const repoDir = path.join(tempDir, owner, repo);
        await getRepo({ repoDir, owner, repo, defaultBranch });
        const dlPaths = fs.readdirSync(tempDir);
        for (const p of dlPaths) {
            filePaths.add(`${ owner }/${ repo }/${ p }`);
        }
    }
    
    return filePaths;
}
