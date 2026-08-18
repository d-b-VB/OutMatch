import { rm, mkdir, copyFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await copyFile("index.html", "dist/index.html");
console.log("Built the self-contained authoritative G67 playable in dist/.");
