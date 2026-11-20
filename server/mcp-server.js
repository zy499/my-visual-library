#!/usr/bin/env node
import readline from "node:readline";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { openLibrary } from "./database.js";
import { normalizeCard } from "../shared/card-format.js";
import {
  getMergedCatalog,
  listLocalDesignMdFiles,
  listLocalSkills,
  readDesignMd,
  readSkillBundle,
  writeDesignMd,
} from "./catalog-loader.js";

const SERVER_INFO = {
  name: "my-visual-library",
  version: "1.0.0",
};

const TRACK_LABELS = {
  ui: "网页与产品 UI",
  graphic: "平面与海报排版",
  cinema: "摄影与电影镜头",
  "ai-art": "插画与 3D 画风",
};

const TOOLS = [
  {
    name: "search_visual_library",
    description:
      "Search the user's local Visual Library (1,216+ cards across Atlas visual references, Motion Prompt animations, DESIGN.md UI design systems, UI Pro Max, Prompt Cookbook, MOKE film/director styles, plus user's own SQLite cards).",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keywords in Chinese or English (e.g. 'Raycast', '苹果暖瓷', 'risograph', '胶片', '分页'). Leave empty to list top matches.",
        },
        type: {
          type: "string",
          enum: ["all", "reference", "technique", "style"],
          description: "Card category filter. Defaults to 'all'.",
        },
        track: {
          type: "string",
          enum: ["all", "ui", "graphic", "cinema", "ai-art"],
          description: "Style sub-track filter when browsing style cards. Defaults to 'all'.",
        },
        origin: {
          type: "string",
          enum: ["", "own", "style", "design-md", "ui-pro-max", "cookbook", "moke-v25", "moke-film", "atlas", "motion"],
          description: "Optional catalog source filter ('own' for user-created/edited cards).",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          description: "Max results to return (default 12).",
        },
      },
    },
  },
  {
    name: "get_card_detail",
    description:
      "Get the complete details of a visual library card by id or title, including full prompt, recipe, notes, tags, and the complete raw DESIGN.md specification when available (e.g. 'style-builtin-porcelain-sticker-studio' or 'style-designmd-raycast').",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Exact card ID from search_visual_library or list_design_systems." },
        title: { type: "string", description: "Fuzzy title lookup if id is not known." },
        includeFullDesignMd: {
          type: "boolean",
          description: "Include the complete local DESIGN.md file content when available (default true).",
        },
      },
    },
  },
  {
    name: "list_design_systems",
    description:
      "List all available local DESIGN.md UI design systems (including the distilled '苹果暖瓷手账风 · Porcelain Sticker Studio' and 84 brand DESIGN.md systems like Raycast, Linear, Stripe, Apple, Vercel, etc.).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional brand or style keyword filter." },
        limit: { type: "integer", minimum: 1, maximum: 120, description: "Max items to return (default 100)." },
      },
    },
  },
  {
    name: "draw_inspiration_brief",
    description:
      "Generate a domain-coherent 3-card creative brief (visual texture + motion/framing + style system) tailored to 'ui', 'graphic', 'cinema', or 'ai-art', optionally locking specific card IDs.",
    inputSchema: {
      type: "object",
      properties: {
        mode: {
          type: "string",
          enum: ["ui", "graphic", "cinema", "ai-art"],
          description: "Target creation scenario (default 'ui').",
        },
        subject: { type: "string", description: "Your creative subject or product page topic." },
        styleId: { type: "string", description: "Optional specific style card ID to lock." },
        refId: { type: "string", description: "Optional specific reference card ID to lock." },
        motionId: { type: "string", description: "Optional specific motion/technique card ID to lock." },
      },
    },
  },
  {
    name: "save_visual_card",
    description:
      "Create or update a card directly in the user's local SQLite Visual Library. Optionally saves a full DESIGN.md markdown file locally so distilled website design systems become reusable immediately in both the web app and MCP.",
    inputSchema: {
      type: "object",
      required: ["title", "type"],
      properties: {
        id: { type: "string", description: "Existing card ID to update; omit to create a new card." },
        title: { type: "string", description: "Card title (required)." },
        type: { type: "string", enum: ["reference", "technique", "style"], description: "Card category." },
        track: {
          type: "string",
          enum: ["ui", "graphic", "cinema", "ai-art"],
          description: "Style track (when type is 'style'); automatically adds the matching track tag.",
        },
        tags: { type: "array", items: { type: "string" }, description: "Tags for filtering." },
        note: { type: "string", description: "Short visual note / style positioning." },
        recipe: { type: "string", description: "Detailed prompt, parameters, or design rules." },
        source: { type: "string", description: "Optional reference URL (http/https)." },
        time: { type: "string", description: "Optional video timestamp (e.g. '01:24-01:28')." },
        designMdSlug: { type: "string", description: "Optional slug (e.g. 'my-site') when saving designMdContent." },
        designMdContent: { type: "string", description: "Optional full DESIGN.md markdown content to save locally in 图鉴素材/design-md/<slug>.md." },
      },
    },
  },
  {
    name: "get_skill_bundle",
    description:
      "Fetch a complete 95%-fidelity distilled website Skill bundle (SKILL.md + full DESIGN.md + drop-in CSS tokens + Motion/React primitives + 3D sticker image prompts) in a single call. Omit 'name' to list available skills.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Skill name (e.g. 'porcelain-sticker-studio' or 'visual-library-distill'). Leave empty to list all available skills.",
        },
      },
    },
  },
  {
    name: "delete_visual_card",
    description: "Delete a user-created card (or revert personal notes on a builtin card) from the local SQLite database.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "Card ID stored in SQLite." },
      },
    },
  },
];

function extractCookbookStyle(promptText, fallbackNote = "") {
  if (!promptText) return fallbackNote.trim();
  const dirMatch = promptText.match(/Style direction:\s*\n([\s\S]*?)(?=\n\n(?:Keep visible:|Avoid:)|$)/i);
  if (dirMatch) {
    const direction = dirMatch[1].replace(/\s+/g, " ").trim();
    const keepMatch = promptText.match(/Keep visible:\s*\n([\s\S]*?)(?=\n\nAvoid:|$)/i);
    const keepBullets = keepMatch
      ? keepMatch[1].split("\n").map((l) => l.replace(/^-\s*/, "").trim()).filter(Boolean).slice(0, 3).join(" ")
      : "";
    return [direction, keepBullets].filter(Boolean).join(" ").trim();
  }
  const firstBlock = promptText.split(/\n\n+/)[0]?.trim() || promptText.trim();
  if (/^[A-Za-z0-9"']/.test(firstBlock) && firstBlock.length > 40) return firstBlock.replace(/\s+/g, " ").trim();
  return promptText.replace(/\s+/g, " ").trim();
}

function pickRandom(list) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export function createMcpHandler(store, options = {}) {
  const canWrite = () => {
    if (typeof options.checkWritePermission === "function") return Boolean(options.checkWritePermission());
    if (typeof options.allowWrite === "boolean") return options.allowWrite;
    return true;
  };

  function handleToolCall(name, args = {}) {
    const catalog = getMergedCatalog(store);

    if (name === "search_visual_library") {
      const query = String(args.query || "").trim().toLowerCase();
      const type = args.type || "all";
      const track = args.track || "all";
      const origin = args.origin || "";
      const limit = Math.min(50, Math.max(1, Number(args.limit) || 12));
      const words = query ? query.split(/\s+/).filter(Boolean) : [];

      const matches = catalog.filter((item) => {
        if (type !== "all" && item.type !== type) return false;
        if (type === "style" && track !== "all" && item.track !== track) return false;
        if (track !== "all" && type === "all" && item.type === "style" && item.track !== track) return false;
        if (origin && (origin === "own" ? !item.edited : item.origin !== origin)) return false;
        if (!words.length) return true;
        const haystack = [
          item.id, item.title, item.note, item.recipe, item.prompt,
          item.group, item.sourceLabel, item.searchExtra, ...(item.tags || []),
        ].filter(Boolean).join(" ").toLowerCase();
        return words.every((w) => haystack.includes(w));
      });

      const items = matches.slice(0, limit).map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        track: item.track || undefined,
        origin: item.origin,
        sourceLabel: item.sourceLabel,
        tags: item.tags,
        note: item.note,
        hasFullDesignMd: Boolean(item.designMdFile),
        promptPreview: (item.prompt || item.recipe || "").slice(0, 220),
      }));

      return {
        totalMatches: matches.length,
        returned: items.length,
        items,
      };
    }

    if (name === "list_design_systems") {
      const query = String(args.query || "").trim().toLowerCase();
      const limit = Math.min(120, Math.max(1, Number(args.limit) || 100));
      const systems = catalog
        .filter((item) => Boolean(item.designMdFile))
        .filter((item) => !query || `${item.id} ${item.title} ${item.note} ${(item.tags || []).join(" ")}`.toLowerCase().includes(query))
        .slice(0, limit)
        .map((item) => ({
          id: item.id,
          title: item.title,
          designMdFile: item.designMdFile,
          tags: item.tags,
          note: item.note,
        }));
      return { total: systems.length, systems };
    }

    if (name === "get_card_detail") {
      const id = String(args.id || "").trim();
      const title = String(args.title || "").trim().toLowerCase();
      const includeFullDesignMd = args.includeFullDesignMd !== false;

      let item = id ? catalog.find((c) => c.id === id) : null;
      if (!item && title) {
        item = catalog.find((c) => c.title.toLowerCase() === title)
          || catalog.find((c) => c.title.toLowerCase().includes(title));
      }
      if (!item) {
        return { error: `未找到卡片：${id || args.title || "(空)"}` };
      }

      const designMdContent = includeFullDesignMd && item.designMdFile
        ? readDesignMd(item.designMdFile)
        : null;

      return {
        id: item.id,
        title: item.title,
        type: item.type,
        track: item.track || undefined,
        origin: item.origin,
        sourceLabel: item.sourceLabel,
        source: item.source || undefined,
        time: item.time || undefined,
        tags: item.tags,
        note: item.note,
        recipe: item.recipe,
        prompt: item.prompt,
        designMdFile: item.designMdFile || undefined,
        designMdContent: designMdContent || undefined,
      };
    }

    if (name === "draw_inspiration_brief") {
      const mode = ["ui", "graphic", "cinema", "ai-art"].includes(args.mode) ? args.mode : "ui";
      const subject = String(args.subject || "").trim();

      const refs = catalog.filter((c) => c.type === "reference" && c.origin === "atlas");
      const motions = catalog.filter((c) => c.origin === "motion");
      const styles = catalog.filter((c) => c.type === "style" && c.track === mode);

      const motionPattern = mode === "ui" ? /^(界面组件|网页效果)/
        : mode === "cinema" ? /^(镜头与转场|摄影与布光)/
        : mode === "graphic" ? /^(图像艺术风格|摄影与布光|动态图形|图表与图解)/
        : /^(图像艺术风格|摄影与布光)/;
      const scopedMotions = motions.filter((m) => motionPattern.test(m.group || ""));

      const refCard = (args.refId && catalog.find((c) => c.id === args.refId)) || pickRandom(refs);
      const motionCard = (args.motionId && catalog.find((c) => c.id === args.motionId)) || pickRandom(scopedMotions.length ? scopedMotions : motions);
      const styleCard = (args.styleId && catalog.find((c) => c.id === args.styleId)) || pickRandom(styles.length ? styles : catalog.filter((c) => c.type === "style"));

      let brief = "";
      if (mode === "ui") {
        brief = [
          `请帮我设计并实现一个「${subject || "现代创意产品页面"}」的前端界面：`,
          styleCard ? `\n1. 整体 UI 设计系统（${styleCard.title}）：\n${styleCard.prompt || styleCard.recipe || styleCard.note}` : "",
          refCard ? `\n2. 局部视觉质感点缀：在主视觉头图或特色卡片中克制融入「${refCard.title}」（${refCard.note}），保持正文高对比度清晰可读。` : "",
          motionCard ? `\n3. 核心交互与动效：重点实现「${motionCard.title}」—— ${motionCard.prompt || motionCard.note}` : "",
          `\n【落地要求】保持整体配色统一、留白舒展、交互流畅并做好桌面与移动端响应式适配。`,
        ].filter(Boolean).join("\n");
      } else if (mode === "cinema") {
        const styleBody = extractCookbookStyle(styleCard?.prompt, styleCard?.note);
        brief = [
          `【镜头画面】${subject || "（填写镜头主体与场景）"}`,
          styleCard ? `【电影与胶片预设】${styleCard.title} — ${styleCard.note}` : "",
          motionCard ? `【运镜与光影节奏】${motionCard.title}（${motionCard.prompt || motionCard.note}）` : "",
          refCard ? `【光学质感参考】${refCard.title}（${refCard.note}）` : "",
          `\n--- Prompt ---\n${[subject, styleBody, refCard?.prompt].filter(Boolean).join(" ")}`,
        ].filter(Boolean).join("\n");
      } else {
        const styleBody = extractCookbookStyle(styleCard?.prompt, styleCard?.note);
        brief = [
          `【画面主体】${subject || "（填写画面主体）"}`,
          styleCard ? `【核心风格基底】${styleCard.title} — ${styleCard.note}` : "",
          refCard ? `【材质与视觉效果】${refCard.title}（${refCard.note}）` : "",
          motionCard ? `【构图与光影参考】${motionCard.title}（${motionCard.note}）` : "",
          `\n--- Prompt ---\n${[subject, styleBody].filter(Boolean).join(". ")}`,
        ].filter(Boolean).join("\n");
      }

      return {
        mode,
        cards: {
          style: styleCard ? { id: styleCard.id, title: styleCard.title, hasFullDesignMd: Boolean(styleCard.designMdFile) } : null,
          reference: refCard ? { id: refCard.id, title: refCard.title } : null,
          motion: motionCard ? { id: motionCard.id, title: motionCard.title } : null,
        },
        brief,
      };
    }

    if (name === "save_visual_card") {
      if (!canWrite()) {
        throw new Error("当前 MCP 授权处于「只读模式」，请在我的视觉库「MCP 连接」中开启「允许 AI 写入」后再试。");
      }
      const existing = args.id ? store.read().find((c) => c.id === args.id) : null;
      const tags = Array.isArray(args.tags) ? args.tags.map((t) => String(t).trim()).filter(Boolean) : [];
      if (args.type === "style" && args.track && TRACK_LABELS[args.track] && !tags.includes(TRACK_LABELS[args.track])) {
        tags.unshift(TRACK_LABELS[args.track]);
      }

      let savedDesignMd = null;
      if (args.designMdContent) {
        const slug = args.designMdSlug || String(args.title || "custom-design").toLowerCase().replace(/[^a-z0-9]+/g, "-") || "custom-design";
        savedDesignMd = writeDesignMd(slug, String(args.designMdContent));
        if (!tags.includes("DESIGN.md")) tags.push("DESIGN.md");
        const slugMarker = `design-md:${savedDesignMd.slug}`;
        if (!tags.includes(slugMarker)) tags.push(slugMarker);
      }

      const rawCard = {
        id: existing?.id || args.id || crypto.randomUUID(),
        type: args.type,
        title: String(args.title || "").trim(),
        source: String(args.source || "").trim(),
        time: String(args.time || "").trim(),
        tags: [...new Set(tags)],
        note: String(args.note || "").trim(),
        recipe: String(args.recipe || "").trim(),
        updated: Date.now(),
      };
      if (existing?.image) rawCard.image = existing.image;

      const card = normalizeCard(rawCard);
      const persisted = store.save(card, existing ? existing.updated : null);
      return {
        saved: true,
        card: persisted,
        designMd: savedDesignMd || undefined,
      };
    }

    if (name === "get_skill_bundle") {
      const skillName = String(args.name || "").trim();
      if (!skillName) {
        return {
          skills: listLocalSkills().map((s) => ({
            name: s.name,
            uri: s.uri,
            referenceFiles: s.references.map((r) => r.name),
          })),
        };
      }
      const bundle = readSkillBundle(skillName);
      if (!bundle) return { error: `未找到 Skill：${skillName}` };
      return bundle;
    }

    if (name === "delete_visual_card") {
      if (!canWrite()) {
        throw new Error("当前 MCP 授权处于「只读模式」，请在我的视觉库「MCP 连接」中开启「允许 AI 写入」后再试。");
      }
      const id = String(args.id || "").trim();
      const existing = store.read().find((c) => c.id === id);
      if (!existing) return { deleted: false, error: `SQLite 中未找到该用户卡片：${id}` };
      store.remove(existing.id, existing.updated);
      return { deleted: true, id: existing.id };
    }

    throw new Error(`Unknown tool: ${name}`);
  }

  function listResources() {
    const designResources = listLocalDesignMdFiles().map((d) => ({
      uri: d.uri,
      name: `${d.slug} · DESIGN.md`,
      description: `Full local DESIGN.md design system specification for ${d.slug}`,
      mimeType: "text/markdown",
    }));
    const skillResources = listLocalSkills().flatMap((s) => [
      {
        uri: s.uri,
        name: `Skill: ${s.name}`,
        description: `Distilled reusable Agent Skill (${s.name})`,
        mimeType: "text/markdown",
      },
      ...s.references.map((r) => ({
        uri: r.uri,
        name: `Skill Reference: ${s.name}/${r.name}`,
        description: `Drop-in reference asset for ${s.name}`,
        mimeType: r.name.endsWith(".css") ? "text/css" : r.name.endsWith(".jsx") ? "text/javascript" : "text/markdown",
      })),
    ]);
    return [...skillResources, ...designResources];
  }

  function readResource(uri) {
    if (uri.startsWith("visual-library://design-md/")) {
      const slug = uri.slice("visual-library://design-md/".length);
      const text = readDesignMd(`${slug}.md`);
      if (text === null) throw new Error(`DESIGN.md not found: ${slug}`);
      return [{ uri, mimeType: "text/markdown", text }];
    }
    if (uri.startsWith("visual-library://skill/")) {
      const rest = uri.slice("visual-library://skill/".length);
      const refMatch = rest.match(/^([^/]+)\/references\/([^/]+)$/);
      if (refMatch) {
        const [, name, refFile] = refMatch;
        const skill = listLocalSkills().find((s) => s.name === name);
        const ref = skill?.references.find((r) => r.name === refFile);
        if (!ref) throw new Error(`Skill reference not found: ${rest}`);
        const mimeType = refFile.endsWith(".css") ? "text/css" : refFile.endsWith(".jsx") ? "text/javascript" : "text/markdown";
        return [{ uri, mimeType, text: readFileSync(ref.fullPath, "utf8") }];
      }
      const skill = listLocalSkills().find((s) => s.name === rest);
      if (!skill) throw new Error(`Skill not found: ${rest}`);
      return [{ uri, mimeType: "text/markdown", text: readFileSync(skill.fullPath, "utf8") }];
    }
    throw new Error(`Unknown resource URI: ${uri}`);
  }

  return function handleMessage(msg) {
    if (!msg || typeof msg !== "object") return null;
    const { id, method, params } = msg;

    // Notifications (no id) require no response
    if (id === undefined || id === null) return null;

    try {
      if (method === "initialize") {
        const protocolVersion = params?.protocolVersion || "2024-11-05";
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion,
            capabilities: {
              tools: { listChanged: false },
              resources: { subscribe: false, listChanged: false },
            },
            serverInfo: SERVER_INFO,
          },
        };
      }
      if (method === "ping") {
        return { jsonrpc: "2.0", id, result: {} };
      }
      if (method === "tools/list") {
        return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
      }
      if (method === "tools/call") {
        const output = handleToolCall(params?.name, params?.arguments || {});
        return {
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          },
        };
      }
      if (method === "resources/list") {
        return { jsonrpc: "2.0", id, result: { resources: listResources() } };
      }
      if (method === "resources/read") {
        return { jsonrpc: "2.0", id, result: { contents: readResource(params?.uri || "") } };
      }
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
    } catch (error) {
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32000, message: error.message || "Internal MCP error" },
      };
    }
  };
}

// Run stdio server when invoked directly
const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const store = openLibrary();
  const handleMessage = createMcpHandler(store);
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      }) + "\n");
      return;
    }
    const response = handleMessage(parsed);
    if (response) process.stdout.write(JSON.stringify(response) + "\n");
  });

  const cleanup = () => {
    try { store.close(); } catch { /* ignore */ }
    process.exit(0);
  };
  rl.on("close", cleanup);
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}
