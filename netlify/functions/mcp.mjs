import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { normalizeCard } from "../../shared/card-format.js";
import { names } from "../../shared/card-data.js";
import {
  getBuiltinCatalog,
  listLocalDesignMdFiles,
  listLocalSkills,
  readDesignMd,
  readSkillBundle,
} from "../../server/catalog-loader.js";
import { openCloudStore, safeEqual } from "./_pg-store.mjs";

const SERVER_INFO = { name: "my-visual-library-cloud", version: "1.0.0" };
const TRACK_LABELS = {
  ui: "网页与产品 UI",
  graphic: "平面与海报排版",
  cinema: "摄影与电影镜头",
  "ai-art": "插画与 3D 画风",
};

const TOOLS = [
  {
    name: "search_visual_library",
    description: "Search the Visual Library (1,216+ built-in references, Motion Prompts, DESIGN.md systems, UI Pro Max, Prompt Cookbook, MOKE styles + user's synced cloud cards).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords in Chinese or English." },
        type: { type: "string", enum: ["all", "reference", "technique", "style"] },
        track: { type: "string", enum: ["all", "ui", "graphic", "cinema", "ai-art"] },
        origin: { type: "string", enum: ["", "own", "style", "design-md", "ui-pro-max", "cookbook", "moke-v25", "moke-film", "atlas", "motion"] },
        limit: { type: "integer", minimum: 1, maximum: 50 },
      },
    },
  },
  {
    name: "get_card_detail",
    description: "Get complete details of a card by id or title, including full prompt, recipe, notes, and full DESIGN.md content when available.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        includeFullDesignMd: { type: "boolean" },
      },
    },
  },
  {
    name: "list_design_systems",
    description: "List all available DESIGN.md UI design systems (including the distilled '苹果暖瓷手账风 · Porcelain Sticker Studio' and 84 brand DESIGN.md systems).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 120 },
      },
    },
  },
  {
    name: "get_skill_bundle",
    description: "Fetch a complete 95%-fidelity distilled website Skill bundle (SKILL.md + full DESIGN.md + drop-in tokens.css + motion-primitives.jsx + sticker-prompts.md).",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string" } },
    },
  },
  {
    name: "draw_inspiration_brief",
    description: "Generate a domain-coherent 3-card creative brief for 'ui', 'graphic', 'cinema', or 'ai-art'.",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["ui", "graphic", "cinema", "ai-art"] },
        subject: { type: "string" },
        styleId: { type: "string" },
        refId: { type: "string" },
        motionId: { type: "string" },
      },
    },
  },
  {
    name: "save_visual_card",
    description: "Create or update a card in the cloud Netlify Postgres Visual Library (requires write permission enabled in MCP center).",
    inputSchema: {
      type: "object",
      required: ["title", "type"],
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        type: { type: "string", enum: ["reference", "technique", "style"] },
        track: { type: "string", enum: ["ui", "graphic", "cinema", "ai-art"] },
        tags: { type: "array", items: { type: "string" } },
        note: { type: "string" },
        recipe: { type: "string" },
        source: { type: "string" },
        time: { type: "string" },
        designMdSlug: { type: "string" },
        designMdContent: { type: "string" },
      },
    },
  },
  {
    name: "delete_visual_card",
    description: "Delete a user card from the cloud Netlify Postgres Visual Library (requires write permission).",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string" } },
    },
  },
];

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function resolveStyleTrack(card) {
  const tags = card.tags || [];
  if (tags.includes("网页与产品 UI") || tags.includes("DESIGN.md")) return "ui";
  if (tags.includes("摄影与电影镜头") || tags.includes("MOKE")) return "cinema";
  if (tags.includes("插画与 3D 画风")) return "ai-art";
  return "graphic";
}

async function getCloudCatalog(store) {
  const { list: builtins, byId: builtinMap } = getBuiltinCatalog();
  const userCards = await store.read();
  const storedMap = new Map(userCards.map((c) => [c.id, c]));

  const custom = userCards
    .filter((c) => !builtinMap.has(c.id))
    .sort((a, b) => (b.updated || 0) - (a.updated || 0))
    .map((card) => {
      const slugTag = (card.tags || []).find((t) => t.startsWith("design-md:"));
      return {
        ...card,
        origin: "own",
        track: card.type === "style" ? resolveStyleTrack(card) : null,
        group: card.type === "style" ? resolveStyleTrack(card) : names[card.type],
        sourceLabel: "我的卡片",
        designMdFile: slugTag ? `design-md/${slugTag.slice(10)}.md` : null,
        cloudDesignSlug: slugTag ? slugTag.slice(10) : null,
        prompt: card.recipe || "",
        builtin: false,
        edited: true,
      };
    });

  const mergedBuiltins = builtins.map((item) => {
    const override = storedMap.get(item.id);
    if (!override) return { ...item, edited: false };
    return {
      ...item,
      ...override,
      origin: item.origin,
      track: item.track || (override.type === "style" ? resolveStyleTrack(override) : null),
      group: item.group,
      designMdFile: item.designMdFile,
      prompt: override.recipe || item.prompt,
      builtin: true,
      edited: true,
    };
  });

  return [...custom, ...mergedBuiltins];
}

function pickRandom(list) {
  return list.length ? list[Math.floor(Math.random() * list.length)] : null;
}

async function handleTool(store, allowWrite, name, args = {}) {
  const catalog = await getCloudCatalog(store);

  if (name === "search_visual_library") {
    const query = String(args.query || "").trim().toLowerCase();
    const type = args.type || "all";
    const track = args.track || "all";
    const origin = args.origin || "";
    const limit = Math.min(50, Math.max(1, Number(args.limit) || 12));
    const words = query ? query.split(/\s+/).filter(Boolean) : [];
    const matches = catalog.filter((item) => {
      if (type !== "all" && item.type !== type) return false;
      if (track !== "all" && item.type === "style" && item.track !== track) return false;
      if (origin && (origin === "own" ? !item.edited : item.origin !== origin)) return false;
      if (!words.length) return true;
      const hay = [item.id, item.title, item.note, item.recipe, item.prompt, item.group, item.sourceLabel, item.searchExtra, ...(item.tags || [])]
        .filter(Boolean).join(" ").toLowerCase();
      return words.every((w) => hay.includes(w));
    });
    return {
      totalMatches: matches.length,
      returned: Math.min(matches.length, limit),
      items: matches.slice(0, limit).map((item) => ({
        id: item.id, title: item.title, type: item.type, track: item.track || undefined,
        origin: item.origin, sourceLabel: item.sourceLabel, tags: item.tags, note: item.note,
        hasFullDesignMd: Boolean(item.designMdFile),
        promptPreview: (item.prompt || item.recipe || "").slice(0, 220),
      })),
    };
  }

  if (name === "list_design_systems") {
    const query = String(args.query || "").trim().toLowerCase();
    const limit = Math.min(120, Math.max(1, Number(args.limit) || 100));
    const systems = catalog
      .filter((item) => Boolean(item.designMdFile))
      .filter((item) => !query || `${item.id} ${item.title} ${item.note} ${(item.tags || []).join(" ")}`.toLowerCase().includes(query))
      .slice(0, limit)
      .map((item) => ({ id: item.id, title: item.title, designMdFile: item.designMdFile, tags: item.tags, note: item.note }));
    return { total: systems.length, systems };
  }

  if (name === "get_card_detail") {
    const id = String(args.id || "").trim();
    const title = String(args.title || "").trim().toLowerCase();
    const includeFullDesignMd = args.includeFullDesignMd !== false;
    let item = id ? catalog.find((c) => c.id === id) : null;
    if (!item && title) item = catalog.find((c) => c.title.toLowerCase().includes(title));
    if (!item) return { error: `未找到卡片：${id || args.title || "(空)"}` };
    let designMdContent = null;
    if (includeFullDesignMd) {
      if (item.cloudDesignSlug) designMdContent = await store.readCloudDesignMd(item.cloudDesignSlug);
      if (!designMdContent && item.designMdFile) designMdContent = readDesignMd(item.designMdFile);
    }
    return {
      id: item.id, title: item.title, type: item.type, track: item.track || undefined,
      origin: item.origin, sourceLabel: item.sourceLabel, source: item.source || undefined,
      tags: item.tags, note: item.note, recipe: item.recipe, prompt: item.prompt,
      designMdFile: item.designMdFile || undefined,
      designMdContent: designMdContent || undefined,
    };
  }

  if (name === "get_skill_bundle") {
    const skillName = String(args.name || "").trim();
    if (!skillName) {
      return { skills: listLocalSkills().map((s) => ({ name: s.name, uri: s.uri, referenceFiles: s.references.map((r) => r.name) })) };
    }
    return readSkillBundle(skillName) || { error: `未找到 Skill：${skillName}` };
  }

  if (name === "draw_inspiration_brief") {
    const mode = ["ui", "graphic", "cinema", "ai-art"].includes(args.mode) ? args.mode : "ui";
    const subject = String(args.subject || "").trim();
    const refs = catalog.filter((c) => c.type === "reference" && c.origin === "atlas");
    const motions = catalog.filter((c) => c.origin === "motion");
    const styles = catalog.filter((c) => c.type === "style" && c.track === mode);
    const motionPattern = mode === "ui" ? /^(界面组件|网页效果)/ : mode === "cinema" ? /^(镜头与转场|摄影与布光)/ : /^(图像艺术风格|摄影与布光)/;
    const scopedMotions = motions.filter((m) => motionPattern.test(m.group || ""));
    const refCard = (args.refId && catalog.find((c) => c.id === args.refId)) || pickRandom(refs);
    const motionCard = (args.motionId && catalog.find((c) => c.id === args.motionId)) || pickRandom(scopedMotions.length ? scopedMotions : motions);
    const styleCard = (args.styleId && catalog.find((c) => c.id === args.styleId)) || pickRandom(styles.length ? styles : catalog.filter((c) => c.type === "style"));
    const brief = [
      `【创作主题】${subject || "现代创意视觉设计"}`,
      styleCard ? `1. 核心风格基底（${styleCard.title}）：\n${styleCard.prompt || styleCard.recipe || styleCard.note}` : "",
      refCard ? `2. 视觉质感点缀：${refCard.title}（${refCard.note}）` : "",
      motionCard ? `3. 动效 / 节奏参考：${motionCard.title}\n${motionCard.prompt || motionCard.note}` : "",
    ].filter(Boolean).join("\n\n");
    return { mode, cards: { style: styleCard?.id, reference: refCard?.id, motion: motionCard?.id }, brief };
  }

  if (name === "save_visual_card") {
    if (!allowWrite) throw new Error("当前云端 MCP 授权处于「只读模式」，请在「MCP 接入」弹窗开启写入授权后再试。");
    const existing = args.id ? (await store.read()).find((c) => c.id === args.id) : null;
    const tags = Array.isArray(args.tags) ? args.tags.map((t) => String(t).trim()).filter(Boolean) : [];
    if (args.type === "style" && args.track && TRACK_LABELS[args.track] && !tags.includes(TRACK_LABELS[args.track])) {
      tags.unshift(TRACK_LABELS[args.track]);
    }
    let savedDesignMd = null;
    if (args.designMdContent) {
      const slug = args.designMdSlug || String(args.title || "custom-design").toLowerCase().replace(/[^a-z0-9]+/g, "-") || "custom-design";
      savedDesignMd = await store.saveCloudDesignMd(slug, String(args.designMdContent));
      if (!tags.includes("DESIGN.md")) tags.push("DESIGN.md");
      const marker = `design-md:${savedDesignMd.slug}`;
      if (!tags.includes(marker)) tags.push(marker);
    }
    const card = normalizeCard({
      id: existing?.id || args.id || crypto.randomUUID(),
      type: args.type,
      title: String(args.title || "").trim(),
      source: String(args.source || "").trim(),
      time: String(args.time || "").trim(),
      tags: [...new Set(tags)],
      note: String(args.note || "").trim(),
      recipe: String(args.recipe || "").trim(),
      updated: Date.now(),
      ...(existing?.image ? { image: existing.image } : {}),
    });
    const persisted = await store.save(card, existing ? existing.updated : null);
    return { saved: true, card: persisted, designMd: savedDesignMd || undefined };
  }

  if (name === "delete_visual_card") {
    if (!allowWrite) throw new Error("当前云端 MCP 授权处于「只读模式」，请在「MCP 接入」弹窗开启写入授权后再试。");
    const existing = (await store.read()).find((c) => c.id === String(args.id || "").trim());
    if (!existing) return { deleted: false, error: `云端数据库中未找到该卡片：${args.id}` };
    await store.remove(existing.id, existing.updated);
    return { deleted: true, id: existing.id };
  }

  throw new Error(`Unknown tool: ${name}`);
}

async function dispatchRpc(store, allowWrite, msg) {
  if (!msg || typeof msg !== "object") return null;
  const { id, method, params } = msg;
  if (id === undefined || id === null) return null;

  try {
    if (method === "initialize") {
      await store.recordMcpCall("initialize");
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: params?.protocolVersion || "2025-03-26",
          capabilities: { tools: { listChanged: false }, resources: { subscribe: false, listChanged: false } },
          serverInfo: SERVER_INFO,
        },
      };
    }
    if (method === "ping") return { jsonrpc: "2.0", id, result: {} };
    if (method === "tools/list") return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
    if (method === "tools/call") {
      if (params?.name) await store.recordMcpCall(params.name);
      const output = await handleTool(store, allowWrite, params?.name, params?.arguments || {});
      return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] } };
    }
    if (method === "resources/list") {
      const resources = [
        ...listLocalSkills().map((s) => ({ uri: s.uri, name: `Skill: ${s.name}`, mimeType: "text/markdown" })),
        ...listLocalDesignMdFiles().map((d) => ({ uri: d.uri, name: `${d.slug} · DESIGN.md`, mimeType: "text/markdown" })),
      ];
      return { jsonrpc: "2.0", id, result: { resources } };
    }
    if (method === "resources/read") {
      const uri = String(params?.uri || "");
      if (uri.startsWith("visual-library://design-md/")) {
        const slug = uri.slice("visual-library://design-md/".length);
        const text = (await store.readCloudDesignMd(slug)) || readDesignMd(`${slug}.md`);
        if (text === null) throw new Error(`DESIGN.md not found: ${slug}`);
        return { jsonrpc: "2.0", id, result: { contents: [{ uri, mimeType: "text/markdown", text }] } };
      }
      if (uri.startsWith("visual-library://skill/")) {
        const name = uri.slice("visual-library://skill/".length);
        const skill = listLocalSkills().find((s) => s.name === name);
        if (!skill) throw new Error(`Skill not found: ${name}`);
        return { jsonrpc: "2.0", id, result: { contents: [{ uri, mimeType: "text/markdown", text: readFileSync(skill.fullPath, "utf8") }] } };
      }
      throw new Error(`Unknown resource URI: ${uri}`);
    }
    return { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } };
  } catch (error) {
    return { jsonrpc: "2.0", id, error: { code: -32000, message: error.message || "Internal MCP error" } };
  }
}

export default async function handler(req) {
  const method = req.method.toUpperCase();
  const store = await openCloudStore();
  const cfg = await store.getMcpConfig();

  if (method === "GET") {
    return json({ app: "my-visual-library-cloud", transport: "streamable-http", enabled: cfg.enabled, auth: "bearer" });
  }
  if (method === "DELETE") {
    return new Response(null, { status: 204 });
  }
  if (method !== "POST") {
    return new Response(null, { status: 405, headers: { Allow: "GET, POST, DELETE" } });
  }
  if (!cfg.enabled) {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32001, message: "云端 MCP 服务已在界面暂停。" } }, 503);
  }
  const authHeader = req.headers.get("authorization") || "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!safeEqual(provided, cfg.token)) {
    return json(
      { jsonrpc: "2.0", id: null, error: { code: -32002, message: "未授权或 Bearer Token 无效。" } },
      401,
      { "WWW-Authenticate": 'Bearer realm="my-visual-library-mcp"' }
    );
  }

  const payload = await req.json().catch(() => null);
  if (!payload) {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400);
  }
  if (Array.isArray(payload)) {
    const results = (await Promise.all(payload.map((m) => dispatchRpc(store, cfg.allowWrite, m)))).filter(Boolean);
    return results.length ? json(results) : new Response(null, { status: 202 });
  }
  const result = await dispatchRpc(store, cfg.allowWrite, payload);
  return result ? json(result) : new Response(null, { status: 202 });
}

export const config = {
  path: "/mcp",
};
