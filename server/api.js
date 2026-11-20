import { timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeCard, validateBackup, validUpdated } from "../shared/card-format.js";
import { StaleCardError } from "./database.js";
import { createMcpHandler } from "./mcp-server.js";

const MAX_JSON_BYTES = 256 * 1024 * 1024;
const STDIO_MCP_PATH = resolve(fileURLToPath(new URL(".", import.meta.url)), "mcp-server.js");

function tokenMatches(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function trustedHost(request) {
  const port = request.socket.localPort;
  return [`127.0.0.1:${port}`, `localhost:${port}`].includes(request.headers.host);
}

function send(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  if (request.headers["content-type"]?.split(";")[0].trim() !== "application/json") {
    throw new RequestError(415, "此操作需要 JSON 数据。");
  }
  if (Number(request.headers["content-length"]) > MAX_JSON_BYTES) {
    request.resume();
    throw new RequestError(413, "单次导入的 JSON 不能超过 256 MB。");
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > MAX_JSON_BYTES) {
      request.resume();
      throw new RequestError(413, "单次导入的 JSON 不能超过 256 MB。");
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RequestError(400, "无法读取 JSON。");
  }
}

function expectedVersion(value) {
  if (value !== null && !validUpdated(value)) throw new RequestError(422, "卡片版本有误，请刷新后重试。");
  return value;
}

function validate(parser, payload) {
  try {
    return parser(payload);
  } catch (error) {
    throw new RequestError(422, error.message);
  }
}

export function createApi(store) {
  const handleMcp = createMcpHandler(store, {
    checkWritePermission: () => store.getMcpConfig().allowWrite,
  });

  function formatMcpConfig(host) {
    const cfg = store.getMcpConfig();
    return {
      ...cfg,
      httpUrl: `http://${host}/mcp`,
      stdioScriptPath: STDIO_MCP_PATH,
    };
  }

  return async function api(request, response) {
    const host = request.headers.host;
    const path = request.url.split("?")[0];
    const method = request.method;

    // Streamable HTTP MCP Endpoint (/mcp) — authenticated by Bearer Token (no Origin header required for CLI/IDE clients)
    if (path === "/mcp") {
      if (!trustedHost(request)) {
        return send(response, 403, { error: "只接受本机 127.0.0.1 / localhost 请求。" });
      }
      if (method === "GET") {
        const cfg = store.getMcpConfig();
        return send(response, 200, {
          app: "my-visual-library",
          transport: "streamable-http",
          enabled: cfg.enabled,
          auth: "bearer",
        });
      }
      if (method === "DELETE") {
        response.writeHead(204).end();
        return;
      }
      if (method !== "POST") {
        response.writeHead(405, { Allow: "GET, POST, DELETE" }).end();
        return;
      }
      const cfg = store.getMcpConfig();
      if (!cfg.enabled) {
        return send(response, 503, {
          jsonrpc: "2.0",
          id: null,
          error: { code: -32001, message: "本地 MCP 授权服务已在视觉库界面暂停，请先开启后再连接。" },
        });
      }
      const authHeader = String(request.headers.authorization || "");
      const providedToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      if (!tokenMatches(providedToken, cfg.token)) {
        response.setHeader("WWW-Authenticate", 'Bearer realm="my-visual-library-mcp"');
        return send(response, 401, {
          jsonrpc: "2.0",
          id: null,
          error: { code: -32002, message: "未授权或 Bearer Token 无效，请在「我的视觉库 → MCP 连接」核对授权密钥。" },
        });
      }
      try {
        const payload = await readJson(request);
        const dispatchOne = (msg) => {
          if (msg?.method === "tools/call" && msg?.params?.name) {
            store.recordMcpCall(msg.params.name);
          } else if (msg?.method === "initialize") {
            store.recordMcpCall("initialize");
          }
          return handleMcp(msg);
        };
        if (Array.isArray(payload)) {
          const results = payload.map(dispatchOne).filter(Boolean);
          if (!results.length) {
            response.writeHead(202).end();
            return;
          }
          return send(response, 200, results);
        }
        const result = dispatchOne(payload);
        if (!result) {
          response.writeHead(202).end();
          return;
        }
        return send(response, 200, result);
      } catch (error) {
        const status = error instanceof RequestError ? error.status : 500;
        return send(response, status, {
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: error.message || "MCP 请求解析失败。" },
        });
      }
    }

    const site = request.headers["sec-fetch-site"];
    if (!trustedHost(request) || (site && !["same-origin", "none"].includes(site)) ||
        (request.headers.origin && request.headers.origin !== `http://${host}`)) {
      return send(response, 403, { error: "只接受本机视觉库页面的请求。" });
    }
    try {
      if (path === "/api/health" && method === "GET") {
        return send(response, 200, { app: "my-visual-library", storage: "sqlite", installationId: store.installationId });
      }
      if (path === "/api/mcp/config") {
        if (method === "GET") return send(response, 200, formatMcpConfig(host));
        if (method === "POST" || method === "PATCH") {
          const patch = await readJson(request);
          store.updateMcpConfig({
            ...(typeof patch?.enabled === "boolean" ? { enabled: patch.enabled } : {}),
            ...(typeof patch?.allowWrite === "boolean" ? { allowWrite: patch.allowWrite } : {}),
          });
          return send(response, 200, formatMcpConfig(host));
        }
      }
      if (path === "/api/mcp/rotate-token" && method === "POST") {
        store.rotateMcpToken();
        return send(response, 200, formatMcpConfig(host));
      }
      if (path === "/api/cards") {
        if (method === "GET") return send(response, 200, { cards: store.read() });
        if (method === "PUT" || method === "DELETE") {
          const payload = await readJson(request);
          const expected = expectedVersion(payload?.expectedUpdated);
          if (method === "PUT") {
            const card = validate(normalizeCard, payload?.card);
            return send(response, 200, { card: store.save(card, expected) });
          }
          if (typeof payload.id !== "string" || !payload.id || expected === null) {
            throw new RequestError(422, "请选择一张已保存的卡片。");
          }
          store.remove(payload.id, expected);
          return send(response, 200, { id: payload.id });
        }
      }
      if (method === "POST" && ["/api/backups/import", "/api/migrations/indexeddb"].includes(path)) {
        const backup = await readJson(request);
        const cards = validate(validateBackup, backup);
        const source = path.endsWith("indexeddb") ? "indexeddb" : "import";
        return send(response, 200, store.merge(cards, source, backup));
      }
      throw new RequestError(404, "没有找到该本地接口。");
    } catch (error) {
      if (error instanceof RequestError) return send(response, error.status, { error: error.message });
      if (error instanceof StaleCardError) return send(response, 409, { error: error.message });
      console.error("SQLite 请求失败", error.code || error.name);
      return send(response, 500, { error: "本地数据库暂时无法完成操作，请稍后重试。" });
    }
  };
}
