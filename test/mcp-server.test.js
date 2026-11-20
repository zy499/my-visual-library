import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { createApi } from "../server/api.js";
import { openLibrary } from "../server/database.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MCP_ENTRY = resolve(ROOT, "server/mcp-server.js");

function spawnMcp(dataDir) {
  const proc = spawn(process.execPath, [MCP_ENTRY], {
    env: { ...process.env, VISUAL_LIBRARY_DATA_DIR: dataDir },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let buffer = "";
  const pending = new Map();

  proc.stdout.setEncoding("utf8");
  proc.stdout.on("data", (chunk) => {
    buffer += chunk;
    let idx;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      const msg = JSON.parse(line);
      const resolveFn = pending.get(msg.id);
      if (resolveFn) {
        pending.delete(msg.id);
        resolveFn(msg);
      }
    }
  });

  let nextId = 1;
  function request(method, params = {}) {
    const id = nextId++;
    return new Promise((res, rej) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        rej(new Error(`MCP timeout for ${method}`));
      }, 5000);
      pending.set(id, (msg) => {
        clearTimeout(timer);
        res(msg);
      });
      proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  }

  return { proc, request };
}

test("MCP stdio server serves catalog, distilled DESIGN.md, inspiration brief, and SQLite write/delete", async () => {
  const dir = mkdtempSync(join(tmpdir(), "visual-lib-mcp-"));
  const { proc, request } = spawnMcp(dir);

  try {
    const init = await request("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "1.0" } });
    assert.equal(init.result.serverInfo.name, "my-visual-library");

    const toolsRes = await request("tools/list");
    const toolNames = toolsRes.result.tools.map((t) => t.name);
    assert.ok(toolNames.includes("search_visual_library"));
    assert.ok(toolNames.includes("get_card_detail"));
    assert.ok(toolNames.includes("list_design_systems"));
    assert.ok(toolNames.includes("draw_inspiration_brief"));
    assert.ok(toolNames.includes("save_visual_card"));
    assert.ok(toolNames.includes("delete_visual_card"));

    // Verify distilled site DESIGN.md is listed and readable in full
    const systemsRes = await request("tools/call", { name: "list_design_systems", arguments: { query: "porcelain" } });
    const systemsData = JSON.parse(systemsRes.result.content[0].text);
    assert.equal(systemsData.total, 1);
    assert.equal(systemsData.systems[0].id, "style-builtin-porcelain-sticker-studio");

    const detailRes = await request("tools/call", {
      name: "get_card_detail",
      arguments: { id: "style-builtin-porcelain-sticker-studio", includeFullDesignMd: true },
    });
    const detail = JSON.parse(detailRes.result.content[0].text);
    assert.match(detail.designMdContent, /# Design System: Porcelain Sticker Studio/);

    // Verify Raycast full DESIGN.md is accessible via MCP
    const rayRes = await request("tools/call", { name: "get_card_detail", arguments: { id: "style-designmd-raycast" } });
    const ray = JSON.parse(rayRes.result.content[0].text);
    assert.match(ray.designMdContent, /Raycast/);
    assert.ok(ray.designMdContent.length > 5000);

    // Verify draw_inspiration_brief returns coherent UI brief
    const briefRes = await request("tools/call", {
      name: "draw_inspiration_brief",
      arguments: { mode: "ui", subject: "AI 播客工作台", styleId: "style-builtin-porcelain-sticker-studio" },
    });
    const briefData = JSON.parse(briefRes.result.content[0].text);
    assert.match(briefData.brief, /AI 播客工作台/);
    assert.equal(briefData.cards.style.id, "style-builtin-porcelain-sticker-studio");

    // Verify save_visual_card + search + delete_visual_card against temp SQLite DB
    const saveRes = await request("tools/call", {
      name: "save_visual_card",
      arguments: {
        title: "MCP 测试风格卡",
        type: "style",
        track: "ui",
        tags: ["测试"],
        note: "通过 MCP 写入的卡片",
        recipe: "Color: #123456",
      },
    });
    const saved = JSON.parse(saveRes.result.content[0].text);
    assert.equal(saved.saved, true);
    assert.ok(saved.card.tags.includes("网页与产品 UI"));

    const searchRes = await request("tools/call", {
      name: "search_visual_library",
      arguments: { query: "MCP 测试风格卡", origin: "own" },
    });
    const found = JSON.parse(searchRes.result.content[0].text);
    assert.equal(found.totalMatches, 1);

    const delRes = await request("tools/call", { name: "delete_visual_card", arguments: { id: saved.card.id } });
    assert.equal(JSON.parse(delRes.result.content[0].text).deleted, true);

    // Verify MCP resources & get_skill_bundle expose full 95%-fidelity bundle
    const skillRes = await request("resources/read", { uri: "visual-library://skill/porcelain-sticker-studio" });
    assert.match(skillRes.result.contents[0].text, /Porcelain Sticker Studio/);

    const bundleRes = await request("tools/call", {
      name: "get_skill_bundle",
      arguments: { name: "porcelain-sticker-studio" },
    });
    const bundle = JSON.parse(bundleRes.result.content[0].text);
    assert.match(bundle.skillMd, /12-Point/);
    assert.match(bundle.designMd, /deck-card/);
    assert.match(bundle.references["tokens.css"], /--paper: #f9f7f2/);
    assert.match(bundle.references["motion-primitives.jsx"], /useChapterScroll/);
    assert.match(bundle.references["sticker-prompts.md"], /3D Clay/);
  } finally {
    proc.stdin.end();
    proc.kill();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Streamable HTTP /mcp enforces Bearer token auth, read-only scope, enable switch, and token rotation", async () => {
  const dir = mkdtempSync(join(tmpdir(), "visual-lib-http-mcp-"));
  const store = openLibrary(dir);
  const api = createApi(store);
  const server = createServer((req, res) => void api(req, res));
  await new Promise((res) => server.listen(0, "127.0.0.1", res));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  try {
    const cfg = store.getMcpConfig();
    assert.match(cfg.token, /^vl_mcp_[0-9a-f]{40}$/);

    // 1. Missing token -> 401
    const unauth = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    assert.equal(unauth.status, 401);

    // 2. Valid Bearer token -> 200 & returns tools
    const okList = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
    });
    assert.equal(okList.status, 200);
    const listBody = await okList.json();
    assert.ok(listBody.result.tools.some((t) => t.name === "get_skill_bundle"));

    // 3. Switch to read-only -> save_visual_card rejected with permission message
    store.updateMcpConfig({ allowWrite: false });
    const roRes = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "save_visual_card", arguments: { title: "禁止写入", type: "style" } },
      }),
    });
    const roBody = await roRes.json();
    assert.match(roBody.error.message, /只读模式/);

    // 4. Rotate token -> old token immediately gets 401, new token succeeds
    const rotated = store.rotateMcpToken();
    assert.notEqual(rotated.token, cfg.token);
    const oldTokenRes = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
      body: JSON.stringify({ jsonrpc: "2.0", id: 4, method: "ping" }),
    });
    assert.equal(oldTokenRes.status, 401);

    const newTokenRes = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${rotated.token}` },
      body: JSON.stringify({ jsonrpc: "2.0", id: 5, method: "ping" }),
    });
    assert.equal(newTokenRes.status, 200);

    // 5. Disable service -> 503
    store.updateMcpConfig({ enabled: false });
    const pausedRes = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${rotated.token}` },
      body: JSON.stringify({ jsonrpc: "2.0", id: 6, method: "ping" }),
    });
    assert.equal(pausedRes.status, 503);
  } finally {
    await new Promise((res) => server.close(res));
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
