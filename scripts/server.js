import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd(), port = Number(process.env.PORT || 5173);
const mime = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".json":"application/json", ".svg":"image/svg+xml" };
createServer(async (req,res) => {
  try {
    const requested = decodeURIComponent(req.url.split("?")[0]);
    let path = normalize(join(root, requested === "/" ? "index.html" : requested));
    if (!path.startsWith(root)) throw new Error("Invalid path");
    if ((await stat(path)).isDirectory()) path=join(path,"index.html");
    res.writeHead(200,{"Content-Type":mime[extname(path)]||"application/octet-stream","Cache-Control":"no-cache"}); res.end(await readFile(path));
  } catch { res.writeHead(404); res.end("Not found"); }
}).listen(port,"0.0.0.0",()=>console.log(`OutMatch ready at http://localhost:${port}`));
