import { createHash, randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { samples } from "../shared/card-data.js";
import { createBackup } from "../shared/card-format.js";

export const defaultDataDirectory = process.platform === "darwin"
  ? join(homedir(), "Library", "Application Support", "我的视觉库")
  : join(process.env.XDG_DATA_HOME || join(homedir(), ".local", "share"), "my-visual-library");

export class StaleCardError extends Error {
  constructor() {
    super("这张卡片已在另一个窗口更新。请重新打开卡片后再保存。");
  }
}

export function openLibrary(directory = process.env.VISUAL_LIBRARY_DATA_DIR || defaultDataDirectory) {
  const dataDirectory = resolve(directory);
  mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
  const filename = join(dataDirectory, "visual-library.sqlite3");
  const db = new DatabaseSync(filename);
  db.exec("PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;");
  const version = db.prepare("PRAGMA user_version").get().user_version;
  if (version > 1) {
    db.close();
    throw new Error("这个数据库由更新版本的视觉库创建。");
  }
  try {
    db.exec("BEGIN IMMEDIATE");
    db.exec(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('reference', 'technique', 'style')),
        title TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT '',
        time TEXT NOT NULL DEFAULT '',
        note TEXT NOT NULL DEFAULT '',
        recipe TEXT NOT NULL DEFAULT '',
        tags TEXT NOT NULL CHECK (json_valid(tags)),
        image TEXT,
        art TEXT,
        sample INTEGER NOT NULL DEFAULT 0,
        updated INTEGER NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS deleted_cards (id TEXT PRIMARY KEY, updated INTEGER NOT NULL) STRICT;
      CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
      CREATE TABLE IF NOT EXISTS imports (
        digest TEXT PRIMARY KEY,
        source TEXT NOT NULL,
        imported_at INTEGER NOT NULL
      ) STRICT;
      PRAGMA user_version = 1;`);
    const createId = db.prepare("INSERT OR IGNORE INTO metadata VALUES ('installation_id', ?)");
    if (createId.run(randomUUID()).changes) {
      const insert = db.prepare(`
        INSERT INTO cards (id,type,title,source,time,note,recipe,tags,image,art,sample,updated)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
      for (const sample of samples) insert.run(...fields({ ...sample, updated: 0 }));
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    db.close();
    throw error;
  }

  const installationId = db.prepare("SELECT value FROM metadata WHERE key = 'installation_id'").get().value;
  const list = db.prepare("SELECT * FROM cards");
  const existing = db.prepare("SELECT updated FROM cards WHERE id = ?");
  const put = db.prepare(`
    INSERT INTO cards (id,type,title,source,time,note,recipe,tags,image,art,sample,updated)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      type=excluded.type,title=excluded.title,source=excluded.source,time=excluded.time,
      note=excluded.note,recipe=excluded.recipe,tags=excluded.tags,image=excluded.image,
      art=excluded.art,sample=excluded.sample,updated=excluded.updated`);
  const deleteCard = db.prepare("DELETE FROM cards WHERE id = ?");
  const addTombstone = db.prepare(`
    INSERT INTO deleted_cards VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET updated=excluded.updated`);
  const tombstone = db.prepare("SELECT updated FROM deleted_cards WHERE id = ?");
  const clearTombstone = db.prepare("DELETE FROM deleted_cards WHERE id = ?");
  const seenImport = db.prepare("SELECT 1 FROM imports WHERE digest = ?");
  const logImport = db.prepare("INSERT OR IGNORE INTO imports VALUES (?, ?, ?)");

  function transaction(run) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = run();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  function save(card, expected) {
    return transaction(() => {
      const current = existing.get(card.id)?.updated ?? null;
      if (current !== expected) throw new StaleCardError();
      const saved = { ...card, updated: Math.max(Date.now(), (current ?? 0) + 1) };
      put.run(...fields(saved));
      clearTombstone.run(card.id);
      return saved;
    });
  }

  function remove(id, expected) {
    transaction(() => {
      const current = existing.get(id)?.updated ?? null;
      if (current !== expected) throw new StaleCardError();
      deleteCard.run(id);
      addTombstone.run(id, Math.max(Date.now(), (current ?? 0) + 1));
    });
  }

  function merge(cards, source, originalBackup) {
    if (!cards.length) return { count: 0, preserved: 0 };
    const payload = JSON.stringify(originalBackup ?? createBackup(cards));
    const digest = createHash("sha256").update(source).update(payload).digest("hex");
    if (source === "indexeddb" && seenImport.get(digest)) return { count: 0, preserved: 0 };
    archive(dataDirectory, source, digest, payload);
    return transaction(() => {
      if (source === "indexeddb" && seenImport.get(digest)) return { count: 0, preserved: 0 };
      let count = 0;
      let preserved = 0;
      for (const card of cards) {
        const current = existing.get(card.id)?.updated;
        const deleted = tombstone.get(card.id)?.updated;
        if ((current !== undefined && current >= card.updated) ||
            (source === "indexeddb" && deleted !== undefined && deleted >= card.updated)) {
          preserved++;
          continue;
        }
        put.run(...fields(card));
        clearTombstone.run(card.id);
        count++;
      }
      logImport.run(digest, source, Date.now());
      return { count, preserved };
    });
  }

  const readMeta = db.prepare("SELECT value FROM metadata WHERE key = ?");
  const writeMeta = db.prepare("INSERT INTO metadata (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");

  function getMeta(key) {
    return readMeta.get(key)?.value ?? null;
  }

  function setMeta(key, value) {
    writeMeta.run(key, String(value));
  }

  function generateMcpToken() {
    return `vl_mcp_${randomBytes(20).toString("hex")}`;
  }

  function getMcpConfig() {
    let token = getMeta("mcp_token");
    if (!token) {
      token = generateMcpToken();
      setMeta("mcp_token", token);
    }
    const enabledRaw = getMeta("mcp_enabled");
    const allowWriteRaw = getMeta("mcp_allow_write");
    const callCountRaw = Number(getMeta("mcp_call_count") || 0);
    const lastCallAtRaw = Number(getMeta("mcp_last_call_at") || 0);
    return {
      enabled: enabledRaw === null ? true : enabledRaw === "1",
      allowWrite: allowWriteRaw === null ? true : allowWriteRaw === "1",
      token,
      callCount: Number.isFinite(callCountRaw) ? callCountRaw : 0,
      lastCallAt: lastCallAtRaw > 0 ? lastCallAtRaw : null,
      lastTool: getMeta("mcp_last_tool") || "",
    };
  }

  function updateMcpConfig(patch = {}) {
    if (typeof patch.enabled === "boolean") setMeta("mcp_enabled", patch.enabled ? "1" : "0");
    if (typeof patch.allowWrite === "boolean") setMeta("mcp_allow_write", patch.allowWrite ? "1" : "0");
    return getMcpConfig();
  }

  function rotateMcpToken() {
    const token = generateMcpToken();
    setMeta("mcp_token", token);
    return getMcpConfig();
  }

  function recordMcpCall(toolName = "") {
    const current = Number(getMeta("mcp_call_count") || 0);
    setMeta("mcp_call_count", String(current + 1));
    setMeta("mcp_last_call_at", String(Date.now()));
    if (toolName) setMeta("mcp_last_tool", String(toolName).slice(0, 80));
  }

  return {
    installationId,
    filename,
    read: () => list.all().map(fromRow),
    save,
    remove,
    merge,
    getMeta,
    setMeta,
    getMcpConfig,
    updateMcpConfig,
    rotateMcpToken,
    recordMcpCall,
    close: () => db.close(),
  };
}

function fields(card) {
  return [
    card.id, card.type, card.title, card.source || "", card.time || "", card.note || "",
    card.recipe || "", JSON.stringify(card.tags), card.image || null, card.art || null,
    card.sample ? 1 : 0, card.updated,
  ];
}

function fromRow(row) {
  const { tags, image, art, sample, ...card } = row;
  return {
    ...card,
    tags: JSON.parse(tags),
    ...(image ? { image } : {}),
    ...(art ? { art } : {}),
    ...(sample ? { sample: true } : {}),
  };
}

function archive(directory, source, digest, payload) {
  const folder = join(directory, "迁移备份");
  mkdirSync(folder, { recursive: true, mode: 0o700 });
  const filename = join(folder, `${source}-${digest}.json`);
  if (existsSync(filename)) return;
  const staging = `${filename}.${randomUUID()}.tmp`;
  try {
    writeFileSync(staging, payload, { flag: "wx", mode: 0o600, flush: true });
    renameSync(staging, filename);
  } finally {
    rmSync(staging, { force: true });
  }
}
