import { execFile } from "node:child_process";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createApi, trustedHost } from "./api.js";
import { openLibrary } from "./database.js";

const root = fileURLToPath(new URL("../dist", import.meta.url));
const port = Number(process.env.VISUAL_LIBRARY_PORT || 48138);
const url = `http://127.0.0.1:${port}/`;
const shouldOpen = process.argv.includes("--open");

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".webp", "image/webp"], [".png", "image/png"], [".jpg", "image/jpeg"], [".jpeg", "image/jpeg"],
  [".gif", "image/gif"], [".avif", "image/avif"], [".svg", "image/svg+xml"],
  [".woff2", "font/woff2"], [".txt", "text/plain; charset=utf-8"], [".md", "text/plain; charset=utf-8"],
]);

function openBrowser() {
  if (shouldOpen && process.platform === "darwin") execFile("open", [url]);
}

async function existingApp() {
  try {
    const response = await fetch(new URL("api/health", url), { signal: AbortSignal.timeout(2000) });
    if (!response.ok) return false;
    const health = await response.json();
    return health.app === "my-visual-library" && health.storage === "sqlite";
  } catch {
    return false;
  }
}

async function serveFile(request, response) {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let filename;
  try {
    const path = decodeURIComponent(new URL(request.url, url).pathname);
    filename = resolve(root, path === "/" ? "index.html" : "." + path);
    if (!filename.startsWith(root + sep)) throw new Error();
    const entry = await stat(filename);
    if (!entry.isFile()) throw new Error();
    response.writeHead(200, {
      "Content-Type": types.get(extname(filename)) || "application/octet-stream",
      "Content-Length": entry.size,
      "Cache-Control": path.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache",
    });
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("找不到这个本地文件。");
    return;
  }
  if (request.method === "HEAD") return response.end();
  createReadStream(filename).on("error", (error) => response.destroy(error)).pipe(response);
}

if (!existsSync(resolve(root, "index.html"))) {
  console.error("请先运行 npm run build，再启动视觉库。");
  process.exitCode = 1;
} else if (await existingApp()) {
  console.log(`我的视觉库已在运行：${url}`);
  openBrowser();
} else {
  const store = openLibrary();
  const api = createApi(store);
  const server = createServer((request, response) => {
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    response.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; media-src 'self' blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    if (!trustedHost(request)) return response.writeHead(403).end();
    if (request.url.startsWith("/api/") || request.url === "/mcp" || request.url.startsWith("/mcp?")) return void api(request, response);
    void serveFile(request, response);
  });
  server.on("error", (error) => {
    store.close();
    console.error(error.code === "EADDRINUSE" ? `端口 ${port} 已被其他程序占用。` : error.message);
    process.exitCode = 1;
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => server.close(() => store.close()));
  }
  server.listen(port, "127.0.0.1", () => {
    console.log(`我的视觉库：${url}\nSQLite：${store.filename}`);
    openBrowser();
  });
}
