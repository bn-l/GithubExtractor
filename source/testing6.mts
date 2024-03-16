
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import tar from "tar";
import { request } from "undici";


const tarurl = "https://github.com/WaterfoxCo/Waterfox/archive/refs/heads/master.tar.gz";
const { statusCode, headers, body } = await request(tarurl, { maxRedirections: 5 });


await pipeline(
    body,
    tar.extract({
        cwd: ".tmp",
        strip: 1,
        filter(path) {
            path = path.toLowerCase();
            if (selectedFiles?.has(path)) {
                selectedFiles.delete(path);
                return true;
            }
            return false;
        },
        onentry(entry) {
            entry.on("end", () => {
                if (selectedFiles?.size === 0) body.destroy();
            });
        },
    })
);
