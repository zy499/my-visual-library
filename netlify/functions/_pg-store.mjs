import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { getDatabase } from "@netlify/database";
import { samples } from "../../shared/card-data.js";
import { createBackup } from "../../shared/card-format.js";

export class StaleCardError extends Error {
  constructor() {
    super("这张卡片已在另一个窗口更新。请重新打开卡片后再保存。");
  }
}

let initializedPromise = null;

function getDb() {
  return getDatabase();
}

async function ensureBootstrapped(db) {
  initializedPromise ??= (async () => {
    // Ensure tables exist even before first migration run, idempotently
    await db.sql`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('reference', 'technique', 'style')),
        title TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT '',
        time TEXT NOT NULL DEFAULT '',
        note TEXT NOT NULL DEFAULT '',
        recipe TEXT NOT NULL DEFAULT '',
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        image TEXT,
        art TEXT,
        sample BOOLEAN NOT NULL DEFAULT FALSE,
        updated BIGINT NOT NULL
      )
    `;
    await db.sql`
      CREATE TABLE IF NOT EXISTS deleted_cards (
        id TEXT PRIMARY KEY,
        updated BIGINT NOT NULL
      )
    `;
    await db.sql`
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `;
    await db.sql`
      CREATE TABLE IF NOT EXISTS imports (
        digest TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        imported_at BIGINT NOT NULL
      )
    `;

    const existingId = await db.sql`SELECT value FROM metadata WHERE key = 'installation_id'`;
    if (!existingId.length) {
      await db.sql`
        INSERT INTO metadata (key, value) VALUES ('installation_id', ${randomUUID()})
        ON CONFLICT (key) DO NOTHING
      `;
    }

    const seeded = await db.sql`SELECT value FROM metadata WHERE key = 'samples_seeded'`;
    if (!seeded.length) {
      const [{ count }] = await db.sql`SELECT COUNT(*)::int AS count FROM cards`;
      if (count === 0) {
        for (const sample of samples) {
          await db.sql`
            INSERT INTO cards (id, type, title, source, time, note, recipe, tags, image, art, sample, updated)
            VALUES (
              ${sample.id}, ${sample.type}, ${sample.title}, ${sample.source || ""},
              ${sample.time || ""}, ${sample.note || ""}, ${sample.recipe || ""},
              ${JSON.stringify(sample.tags)}::jsonb, ${sample.image || null},
              ${sample.art || null}, ${Boolean(sample.sample)}, ${sample.updated || 0}
            )
            ON CONFLICT (id) DO NOTHING
          `;
        }
      }
      await db.sql`
        INSERT INTO metadata (key, value) VALUES ('samples_seeded', '1')
        ON CONFLICT (key) DO NOTHING
      `;
    }
  })().catch((err) => {
    initializedPromise = null;
    throw err;
  });
  return initializedPromise;
}

function fromRow(row) {
  const tags = Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || "[]");
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    source: row.source || "",
    time: row.time || "",
    note: row.note || "",
    recipe: row.recipe || "",
    tags,
    updated: Number(row.updated) || 0,
    ...(row.image ? { image: row.image } : {}),
    ...(row.art ? { art: row.art } : {}),
    ...(row.sample ? { sample: true } : {}),
  };
}

export function safeEqual(a, b) {
  if (!a || !b) return false;
  const ba = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function openCloudStore() {
  const db = getDb();
  await ensureBootstrapped(db);

  async function getMeta(key) {
    const rows = await db.sql`SELECT value FROM metadata WHERE key = ${key}`;
    return rows[0]?.value ?? null;
  }

  async function setMeta(key, value) {
    await db.sql`
      INSERT INTO metadata (key, value) VALUES (${key}, ${String(value)})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  }

  async function installationId() {
    return (await getMeta("installation_id")) || "netlify-cloud";
  }

  async function read() {
    const rows = await db.sql`SELECT * FROM cards ORDER BY updated DESC, id ASC`;
    return rows.map(fromRow);
  }

  async function save(card, expectedUpdated) {
    const existingRows = await db.sql`SELECT updated FROM cards WHERE id = ${card.id}`;
    const current = existingRows[0] ? Number(existingRows[0].updated) : null;
    if (expectedUpdated === null ? current !== null : current !== expectedUpdated) {
      throw new StaleCardError();
    }
    const next = { ...card, updated: Math.max(Date.now(), (current ?? 0) + 1) };
    await db.sql`
      INSERT INTO cards (id, type, title, source, time, note, recipe, tags, image, art, sample, updated)
      VALUES (
        ${next.id}, ${next.type}, ${next.title}, ${next.source || ""},
        ${next.time || ""}, ${next.note || ""}, ${next.recipe || ""},
        ${JSON.stringify(next.tags)}::jsonb, ${next.image || null},
        ${next.art || null}, ${Boolean(next.sample)}, ${next.updated}
      )
      ON CONFLICT (id) DO UPDATE SET
        type = EXCLUDED.type,
        title = EXCLUDED.title,
        source = EXCLUDED.source,
        time = EXCLUDED.time,
        note = EXCLUDED.note,
        recipe = EXCLUDED.recipe,
        tags = EXCLUDED.tags,
        image = EXCLUDED.image,
        art = EXCLUDED.art,
        sample = EXCLUDED.sample,
        updated = EXCLUDED.updated
    `;
    await db.sql`DELETE FROM deleted_cards WHERE id = ${next.id}`;
    return next;
  }

  async function remove(id, expectedUpdated) {
    const existingRows = await db.sql`SELECT updated FROM cards WHERE id = ${id}`;
    const current = existingRows[0] ? Number(existingRows[0].updated) : null;
    if (current === null || current !== expectedUpdated) {
      throw new StaleCardError();
    }
    await db.sql`DELETE FROM cards WHERE id = ${id}`;
    await db.sql`
      INSERT INTO deleted_cards (id, updated) VALUES (${id}, ${Date.now()})
      ON CONFLICT (id) DO UPDATE SET updated = EXCLUDED.updated
    `;
  }

  async function merge(cards, source, rawBackup) {
    const payload = JSON.stringify(rawBackup ?? createBackup(cards));
    const digest = createHash("sha256").update(payload).digest("hex");
    const existingList = await read();
    const existing = new Map(existingList.map((c) => [c.id, c]));
    const tombRows = await db.sql`SELECT id, updated FROM deleted_cards`;
    const tombstones = new Map(tombRows.map((r) => [r.id, Number(r.updated)]));
    let count = 0;
    let preserved = 0;

    for (const card of cards) {
      const current = existing.get(card.id)?.updated;
      const deleted = tombstones.get(card.id);
      if ((current !== undefined && current >= card.updated) ||
          (source === "indexeddb" && deleted !== undefined && deleted >= card.updated)) {
        preserved++;
        continue;
      }
      await db.sql`
        INSERT INTO cards (id, type, title, source, time, note, recipe, tags, image, art, sample, updated)
        VALUES (
          ${card.id}, ${card.type}, ${card.title}, ${card.source || ""},
          ${card.time || ""}, ${card.note || ""}, ${card.recipe || ""},
          ${JSON.stringify(card.tags)}::jsonb, ${card.image || null},
          ${card.art || null}, ${Boolean(card.sample)}, ${card.updated}
        )
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type,
          title = EXCLUDED.title,
          source = EXCLUDED.source,
          time = EXCLUDED.time,
          note = EXCLUDED.note,
          recipe = EXCLUDED.recipe,
          tags = EXCLUDED.tags,
          image = EXCLUDED.image,
          art = EXCLUDED.art,
          sample = EXCLUDED.sample,
          updated = EXCLUDED.updated
      `;
      await db.sql`DELETE FROM deleted_cards WHERE id = ${card.id}`;
      count++;
    }
    await db.sql`
      INSERT INTO imports (digest, source, imported_at) VALUES (${digest}, ${source}, ${Date.now()})
      ON CONFLICT (digest) DO NOTHING
    `;
    return { count, preserved };
  }

  function generateMcpToken() {
    return `vl_mcp_${randomBytes(20).toString("hex")}`;
  }

  async function getMcpConfig() {
    let token = await getMeta("mcp_token");
    if (!token) {
      token = generateMcpToken();
      await setMeta("mcp_token", token);
    }
    const enabledRaw = await getMeta("mcp_enabled");
    const allowWriteRaw = await getMeta("mcp_allow_write");
    const callCountRaw = Number((await getMeta("mcp_call_count")) || 0);
    const lastCallAtRaw = Number((await getMeta("mcp_last_call_at")) || 0);
    return {
      enabled: enabledRaw === null ? true : enabledRaw === "1",
      allowWrite: allowWriteRaw === null ? true : allowWriteRaw === "1",
      token,
      callCount: Number.isFinite(callCountRaw) ? callCountRaw : 0,
      lastCallAt: lastCallAtRaw > 0 ? lastCallAtRaw : null,
      lastTool: (await getMeta("mcp_last_tool")) || "",
    };
  }

  async function updateMcpConfig(patch = {}) {
    if (typeof patch.enabled === "boolean") await setMeta("mcp_enabled", patch.enabled ? "1" : "0");
    if (typeof patch.allowWrite === "boolean") await setMeta("mcp_allow_write", patch.allowWrite ? "1" : "0");
    return getMcpConfig();
  }

  async function rotateMcpToken() {
    const token = generateMcpToken();
    await setMeta("mcp_token", token);
    return getMcpConfig();
  }

  async function recordMcpCall(toolName = "") {
    const current = Number((await getMeta("mcp_call_count")) || 0);
    await setMeta("mcp_call_count", String(current + 1));
    await setMeta("mcp_last_call_at", String(Date.now()));
    if (toolName) await setMeta("mcp_last_tool", String(toolName).slice(0, 80));
  }

  async function saveCloudDesignMd(slug, content) {
    const clean = String(slug || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64);
    if (!clean) throw new Error("无效的 designMdSlug。");
    await setMeta(`design_md:${clean}`, String(content));
    return { slug: clean, relFile: `design-md/${clean}.md` };
  }

  async function readCloudDesignMd(slug) {
    return getMeta(`design_md:${slug}`);
  }

  return {
    installationId,
    read,
    save,
    remove,
    merge,
    getMeta,
    setMeta,
    getMcpConfig,
    updateMcpConfig,
    rotateMcpToken,
    recordMcpCall,
    saveCloudDesignMd,
    readCloudDesignMd,
  };
}
