
import { request } from "undici";


export async function getDefaultBranch({ owner, repo }: { owner: string; repo: string }) {

    const url = `https://api.github.com/repos/${ owner }/${ repo }`;
    const { statusCode, headers, body } = await request(url);
    const data = await body.json() as { default_branch: string };
    
    if (!("default_branch" in data)) {
        throw new Error("No default branch found in response from " + url);
    }
    
    return data.default_branch;
}
