import { createBackup } from "../shared/card-format.js";
export { sourceLink } from "../shared/card-format.js";

const adminPasscodeKey = "my-visual-library-admin-passcode";

export function getAdminPasscode() {
  try { return localStorage.getItem(adminPasscodeKey) || ""; }
  catch { return ""; }
}

export function setAdminPasscode(value) {
  try {
    if (value) localStorage.setItem(adminPasscodeKey, value);
    else localStorage.removeItem(adminPasscodeKey);
  } catch { /* ignore */ }
}

async function request(path, method = "GET", body) {
  const passcode = getAdminPasscode();
  const headers = {
    ...(passcode ? { "X-Admin-Passcode": passcode } : {}),
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
  };
  const response = await fetch(path, {
    method,
    cache: "no-store",
    headers,
    ...(body !== undefined && {
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) {
    const error = new Error(result?.error || "无法连接视觉库的数据服务。");
    error.status = response.status;
    throw error;
  }
  return result;
}

export async function verifyAdminPasscode(passcode) {
  const res = await fetch("/api/auth/verify", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || "口令验证失败。");
  }
  setAdminPasscode(passcode);
  return true;
}

function readLegacyCards() {
  return new Promise((resolve, reject) => {
    let missing = false;
    const open = indexedDB.open("my-visual-library-cards");
    open.onupgradeneeded = () => {
      missing = true;
      open.transaction.abort();
    };
    open.onerror = () => missing ? resolve([]) : reject(open.error);
    open.onsuccess = () => {
      const database = open.result;
      if (!database.objectStoreNames.contains("cards")) {
        database.close();
        resolve([]);
        return;
      }
      const transaction = database.transaction("cards", "readonly");
      const read = transaction.objectStore("cards").getAll();
      transaction.oncomplete = () => {
        database.close();
        resolve(read.result);
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error);
      };
    };
  });
}

let indexedDbMigration;

function migrateIndexedDb(installationId) {
  indexedDbMigration ??= (async () => {
    const key = "my-visual-library-sqlite-v1:" + installationId;
    try { if (localStorage.getItem(key) === "complete") return 0; }
    catch { /* The server also recognizes previously imported snapshots. */ }
    const cards = await readLegacyCards();
    const result = cards.length
      ? await request("/api/migrations/indexeddb", "POST", createBackup(cards))
      : { count: 0 };
    try { localStorage.setItem(key, "complete"); }
    catch { /* The source database still remains untouched. */ }
    return result.count;
  })().catch((error) => {
    indexedDbMigration = undefined;
    throw error;
  });
  return indexedDbMigration;
}

export async function loadLibrary() {
  const health = await request("/api/health");
  if (!["sqlite", "postgres"].includes(health.storage)) throw new Error("数据服务尚未启动。");
  let migrated = 0;
  let migrationWarning = false;
  if (health.storage === "sqlite") {
    try { migrated = await migrateIndexedDb(health.installationId); }
    catch { migrationWarning = true; }
  }
  return {
    cards: await readCards(),
    storage: health.storage,
    authRequired: Boolean(health.authRequired),
    unlocked: health.unlocked !== false,
    migrated,
    migrationWarning,
  };
}

export async function readCards() {
  return (await request("/api/cards")).cards;
}

export async function saveCard(card, expectedUpdated) {
  return (await request("/api/cards", "PUT", { card, expectedUpdated })).card;
}

export async function removeCard(id, expectedUpdated) {
  await request("/api/cards", "DELETE", { id, expectedUpdated });
}

export async function readMcpConfig() {
  return request("/api/mcp/config");
}

export async function updateMcpConfig(patch) {
  return request("/api/mcp/config", "POST", patch);
}

export async function rotateMcpToken() {
  return request("/api/mcp/rotate-token", "POST", {});
}

export async function importBackup(file) {
  if (file.size > 256 * 1024 * 1024) throw new Error("单次导入的 JSON 不能超过 256 MB。");
  return request("/api/backups/import", "POST", await file.text());
}

export function exportBackup(cards) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(createBackup(cards), null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "我的视觉库-备份.json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function downloadDesignMdFile(url, filename = "DESIGN.md") {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("无法读取本地 DESIGN.md 文件。");
  const text = await response.text();
  const blobUrl = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  return text.length;
}

export async function copyDesignMdFile(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("无法读取本地 DESIGN.md 文件。");
  const text = await response.text();
  const ok = await copyText(text);
  return { ok, chars: text.length };
}

export async function imageData(file) {
  if (file.size > 25 * 1024 * 1024) throw new Error("请选择小于 25 MB 的截图。");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const factor = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * factor));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * factor));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/webp", 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const previous = document.activeElement;
    const buffer = document.createElement("textarea");
    buffer.className = "clipboard-buffer";
    buffer.value = value;
    (document.querySelector("dialog[open]") || document.body).append(buffer);
    buffer.select();
    try {
      return document.execCommand("copy");
    } finally {
      buffer.remove();
      previous?.focus({ preventScroll: true });
    }
  }
}
