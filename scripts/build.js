import { rm, mkdir, copyFile } from "node:fs/promises";
import { dirname } from "node:path";

const files=["index.html","src/app.js","src/styles.css","src/engine.js","src/generals.js","src/replay.js"];
await rm("dist",{recursive:true,force:true});
for(const file of files){const target=`dist/${file}`;await mkdir(dirname(target),{recursive:true});await copyFile(file,target)}
console.log(`Built ${files.length} production files in dist/`);
