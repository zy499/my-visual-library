import { normalizeCard, validateBackup, validUpdated } from "../../shared/card-format.js";
import { openCloudStore, safeEqual, StaleCardError } from "./_pg-store.mjs";

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function getAdminPasscode() {
  return (globalThis.Netlify?.env?.get("ADMIN_PASSCODE") || process.env.ADMIN_PASSCODE || "").trim();
}

function isAuthorized(req) {
  const expected = getAdminPasscode();
  if (!expected) return true;
  const provided = (req.headers.get("x-admin-passcode") || "").trim();
  return safeEqual(provided, expected);
}

function expectedVersion(value) {
  if (value !== null && !validUpdated(value)) {
    throw Object.assign(new Error("卡片版本有误，请刷新后重试。"), { status: 422 });
  }
  return value;
}

export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method.toUpperCase();

  try {
    const store = await openCloudStore();
    const authRequired = Boolean(getAdminPasscode());
    const unlocked = isAuthorized(req);

    if (path === "/api/health" && method === "GET") {
      return json({
        app: "my-visual-library",
        storage: "postgres",
        authRequired,
        unlocked,
        installationId: await store.installationId(),
      });
    }

    if (path === "/api/auth/verify" && method === "POST") {
      const body = await req.json().catch(() => null);
      const expected = getAdminPasscode();
      if (!expected) return json({ ok: true, unlocked: true });
      const provided = String(body?.passcode || "").trim();
      if (!safeEqual(provided, expected)) {
        return json({ ok: false, error: "管理口令不正确，请重新输入。" }, 401);
      }
      return json({ ok: true, unlocked: true });
    }

    if (path === "/api/cards") {
      if (method === "GET") {
        return json({ cards: await store.read() });
      }
      if (!unlocked) {
        return json({ error: "当前为云端只读浏览模式，请先输入管理口令解锁编辑权限。" }, 401);
      }
      if (method === "PUT" || method === "DELETE") {
        const payload = await req.json().catch(() => null);
        if (!payload) return json({ error: "无法读取 JSON。" }, 400);
        const expected = expectedVersion(payload?.expectedUpdated);
        if (method === "PUT") {
          let card;
          try {
            card = normalizeCard(payload?.card);
          } catch (error) {
            return json({ error: error.message }, 422);
          }
          return json({ card: await store.save(card, expected) });
        }
        if (typeof payload.id !== "string" || !payload.id || expected === null) {
          return json({ error: "请选择一张已保存的卡片。" }, 422);
        }
        await store.remove(payload.id, expected);
        return json({ id: payload.id });
      }
    }

    if (method === "POST" && (path === "/api/backups/import" || path === "/api/migrations/indexeddb")) {
      if (!unlocked) {
        return json({ error: "请先输入管理口令解锁后再导入备份。" }, 401);
      }
      const backup = await req.json().catch(() => null);
      let cards;
      try {
        cards = validateBackup(backup);
      } catch (error) {
        return json({ error: error.message }, 422);
      }
      const source = path.endsWith("indexeddb") ? "indexeddb" : "import";
      return json(await store.merge(cards, source, backup));
    }

    if (path === "/api/mcp/config" || path === "/api/mcp/rotate-token") {
      if (!unlocked) {
        return json({ error: "查看和管理云端 MCP 授权密钥需要先验证管理口令。" }, 401);
      }
      const formatConfig = (cfg) => ({
        ...cfg,
        httpUrl: `${url.origin}/mcp`,
        stdioScriptPath: "",
        cloudMode: true,
      });
      if (path === "/api/mcp/config" && method === "GET") {
        return json(formatConfig(await store.getMcpConfig()));
      }
      if (path === "/api/mcp/config" && (method === "POST" || method === "PATCH")) {
        const patch = await req.json().catch(() => ({}));
        const next = await store.updateMcpConfig({
          ...(typeof patch?.enabled === "boolean" ? { enabled: patch.enabled } : {}),
          ...(typeof patch?.allowWrite === "boolean" ? { allowWrite: patch.allowWrite } : {}),
        });
        return json(formatConfig(next));
      }
      if (path === "/api/mcp/rotate-token" && method === "POST") {
        return json(formatConfig(await store.rotateMcpToken()));
      }
    }

    return json({ error: "没有找到该接口。" }, 404);
  } catch (error) {
    if (error instanceof StaleCardError) return json({ error: error.message }, 409);
    if (error?.status) return json({ error: error.message }, error.status);
    console.error("Cloud API error:", error);
    return json({ error: "云端数据库暂时无法完成操作，请稍后重试。" }, 500);
  }
}

export const config = {
  path: [
    "/api/health",
    "/api/auth/verify",
    "/api/cards",
    "/api/backups/import",
    "/api/migrations/indexeddb",
    "/api/mcp/config",
    "/api/mcp/rotate-token",
  ],
};
