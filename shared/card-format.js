import { artTypes, names } from "./card-data.js";

export const backupFormat = "my-visual-library";
export const backupVersion = 1;

const safeImage = /^data:image\/(?:jpeg|png|webp|gif|avif);base64,[a-z\d+/]+={0,2}$/i;

export function validUpdated(value) {
  return Number.isSafeInteger(value) && value >= 0 && value < Number.MAX_SAFE_INTEGER;
}

export function sourceLink(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export function normalizeCard(card) {
  if (!card || !Object.hasOwn(names, card.type) || typeof card.id !== "string" || !card.id ||
      typeof card.title !== "string" || !card.title.trim() || !Array.isArray(card.tags) ||
      !card.tags.every((tag) => typeof tag === "string")) {
    throw new Error("备份或卡片的数据格式有误。");
  }
  if (card.image && (typeof card.image !== "string" || !safeImage.test(card.image))) {
    throw new Error("卡片包含无法识别的封面。");
  }
  const clean = {
    id: card.id,
    type: card.type,
    title: card.title,
    source: sourceLink(card.source),
    tags: [...new Set(card.tags)],
    updated: validUpdated(card.updated) ? card.updated : 0,
  };
  for (const key of ["time", "note", "recipe"]) {
    clean[key] = typeof card[key] === "string" ? card[key] : "";
  }
  if (card.image) clean.image = card.image;
  if (artTypes.includes(card.art)) clean.art = card.art;
  if (card.sample === true) clean.sample = true;
  return clean;
}

export function createBackup(cards) {
  return { format: backupFormat, version: backupVersion, cards };
}

export function validateBackup(data) {
  if (data?.format !== backupFormat || data.version !== backupVersion || !Array.isArray(data.cards)) {
    throw new Error("请选择视觉库导出的 JSON 备份。");
  }
  return data.cards.map(normalizeCard);
}
