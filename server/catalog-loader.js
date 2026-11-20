import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import atlasZh from "../src/atlas-zh.js";
import { styleRecipes } from "../src/style-recipes.js";
import { names } from "../shared/card-data.js";

export const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
export const DESIGN_MD_DIR = resolve(PROJECT_ROOT, "图鉴素材/design-md");
export const SKILLS_DIR = resolve(PROJECT_ROOT, "skills");

function loadScriptBinding(relPath, binding) {
  const fullPath = resolve(PROJECT_ROOT, relPath);
  const code = readFileSync(fullPath, "utf8") + `\n;globalThis.__EXPORT__ = ${binding};`;
  const context = { globalThis: {} };
  vm.runInNewContext(code, context, { filename: fullPath });
  return context.globalThis.__EXPORT__;
}

function resolveStyleTrack(entry) {
  if (entry.track) return entry.track;
  const tags = entry.tags || [];
  if (tags.includes("网页与产品 UI") || tags.includes("DESIGN.md")) return "ui";
  if (tags.includes("摄影与电影镜头") || tags.includes("MOKE")) return "cinema";
  if (tags.includes("插画与 3D 画风")) return "ai-art";
  return "graphic";
}

let cachedBuiltins = null;

export function getBuiltinCatalog() {
  if (cachedBuiltins) return cachedBuiltins;

  const referenceCatalog = loadScriptBinding("参考图鉴.js", "referenceCatalog");
  const atlas = loadScriptBinding("图鉴素材/atlas/词条.js", "atlasPreviewData");
  const motion = loadScriptBinding("图鉴素材/motion/词条.js", "motionPreviewData");
  const externalStyles = loadScriptBinding("图鉴素材/styles/词条.js", "externalStyleCatalog");

  const originals = styleRecipes.map((item, position) => ({
    id: `style-builtin-${item.key}`,
    type: "style",
    origin: "style",
    track: item.track,
    group: item.group,
    sourceLabel: item.sourceLabel,
    designMdFile: item.designMdFile || null,
    title: item.title,
    source: item.sourceUrl || "",
    time: "",
    tags: item.tags || [],
    note: item.note || "",
    recipe: item.recipe || "",
    prompt: item.prompt || "",
    order: position,
    builtin: true,
  }));

  const externals = externalStyles.map((item, position) => ({
    id: `style-${item.id}`,
    type: "style",
    origin: item.origin,
    track: item.track,
    group: item.group,
    sourceLabel: item.sourceLabel,
    designMdFile: item.designMdFile || null,
    localImage: item.image || null,
    title: item.title,
    source: item.source || "",
    time: "",
    tags: item.tags || ["风格库"],
    note: item.note || "",
    recipe: item.recipe || "",
    prompt: item.prompt || "",
    order: 100 + position,
    builtin: true,
  }));

  const refsAndMotions = Object.entries(referenceCatalog).flatMap(([origin, catalog]) => {
    const curated = new Map(Object.keys(catalog.selected).map((id, position) => [id, position]));
    const isAtlas = origin === "atlas";
    return catalog.rows.map(([key, english, group, source, originalGroup]) => {
      const annotation = catalog.selected[key];
      const zhFallback = isAtlas ? atlasZh[key] : null;
      const chinese = annotation?.[0] || zhFallback?.[0] || (!isAtlas && motion[key]?.[2]);
      return {
        id: `reference-${origin}-${key}`,
        type: isAtlas ? "reference" : "technique",
        origin,
        key,
        group,
        sourceLabel: isAtlas ? "Atlas" : `Motion #${key}`,
        title: chinese && chinese !== english ? `${chinese} · ${english}` : english,
        source: source || "",
        time: "",
        tags: [isAtlas ? "Atlas" : "Motion Prompt", group],
        note: annotation?.[1] || zhFallback?.[1] || (!isAtlas ? motion[key]?.[3] : "") || "",
        recipe: annotation?.[2] || "",
        prompt: (isAtlas ? atlas[key]?.prompt : motion[key]?.[4]) || "",
        searchExtra: [key, english, chinese, zhFallback?.[1], originalGroup].filter(Boolean).join(" "),
        order: 1000 + (curated.get(key) ?? 9999),
        builtin: true,
      };
    });
  });

  const list = [...originals, ...externals, ...refsAndMotions];
  cachedBuiltins = { list, byId: new Map(list.map((item) => [item.id, item])) };
  return cachedBuiltins;
}

export function getMergedCatalog(store) {
  const { list: builtins, byId: builtinMap } = getBuiltinCatalog();
  const userCards = store ? store.read() : [];
  const storedMap = new Map(userCards.map((c) => [c.id, c]));

  const custom = userCards
    .filter((c) => !builtinMap.has(c.id))
    .sort((a, b) => (b.updated || 0) - (a.updated || 0))
    .map((card) => {
      const slugTag = (card.tags || []).find((t) => t.startsWith("design-md:"));
      const designMdFile = slugTag ? `design-md/${slugTag.slice(10)}.md` : null;
      return {
        ...card,
        origin: "own",
        track: card.type === "style" ? resolveStyleTrack(card) : null,
        group: card.type === "style" ? resolveStyleTrack(card) : names[card.type],
        sourceLabel: "我的卡片",
        designMdFile,
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

export function readDesignMd(relFile) {
  if (!relFile) return null;
  const name = basename(relFile);
  if (!/^[a-z0-9][a-z0-9._-]*\.md$/i.test(name)) return null;
  const fullPath = resolve(DESIGN_MD_DIR, name);
  if (!existsSync(fullPath)) return null;
  return readFileSync(fullPath, "utf8");
}

export function writeDesignMd(slug, content) {
  const clean = String(slug || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  if (!clean) throw new Error("无效的 designMdSlug，请使用英文/数字/连字符（如 my-studio）。");
  mkdirSync(DESIGN_MD_DIR, { recursive: true });
  const target = resolve(DESIGN_MD_DIR, `${clean}.md`);
  writeFileSync(target, content, "utf8");
  const distDir = resolve(PROJECT_ROOT, "dist/图鉴素材/design-md");
  if (existsSync(resolve(PROJECT_ROOT, "dist/图鉴素材"))) {
    mkdirSync(distDir, { recursive: true });
    writeFileSync(resolve(distDir, `${clean}.md`), content, "utf8");
  }
  return { slug: clean, relFile: `design-md/${clean}.md`, fullPath: target };
}

export function listLocalDesignMdFiles() {
  if (!existsSync(DESIGN_MD_DIR)) return [];
  return readdirSync(DESIGN_MD_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((file) => ({
      slug: file.replace(/\.md$/, ""),
      file,
      uri: `visual-library://design-md/${file.replace(/\.md$/, "")}`,
      fullPath: join(DESIGN_MD_DIR, file),
    }));
}

export function listLocalSkills() {
  if (!existsSync(SKILLS_DIR)) return [];
  const skills = [];
  for (const dir of readdirSync(SKILLS_DIR).sort()) {
    const file = join(SKILLS_DIR, dir, "SKILL.md");
    if (existsSync(file)) {
      const refDir = join(SKILLS_DIR, dir, "references");
      const references = existsSync(refDir)
        ? readdirSync(refDir).sort().map((f) => ({
            name: f,
            uri: `visual-library://skill/${dir}/references/${f}`,
            fullPath: join(refDir, f),
          }))
        : [];
      skills.push({
        name: dir,
        uri: `visual-library://skill/${dir}`,
        fullPath: file,
        references,
      });
    }
  }
  return skills;
}

export function readSkillBundle(name) {
  const skill = listLocalSkills().find((s) => s.name === name);
  if (!skill) return null;
  const skillMd = readFileSync(skill.fullPath, "utf8");
  const designMd = readDesignMd(`${name}.md`);
  const references = {};
  for (const ref of skill.references) {
    references[ref.name] = readFileSync(ref.fullPath, "utf8");
  }
  return {
    name: skill.name,
    skillMd,
    designMd: designMd || undefined,
    references,
  };
}
