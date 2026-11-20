import referenceCatalog from "virtual:visual-catalog";
import atlas from "virtual:atlas-previews";
import motion from "virtual:motion-previews";
import externalStyleCatalog from "virtual:external-styles";
import atlasZh from "./atlas-zh.js";
import { styleRecipes } from "./style-recipes.js";
import { samples } from "../shared/card-data.js";

export { atlas, motion };
export { names } from "../shared/card-data.js";
export { styleTracks } from "./style-recipes.js";
export const asset = (path) => new URL(`${import.meta.env.BASE_URL}图鉴素材/${path}`, document.baseURI).href;

export const featured = [
  {id:"risograph", title:"套色印刷", category:"印刷质感", description:"用几层专色叠印，留下油墨颗粒和细小错位。适合标题卡、栏目海报和纸感视觉。"},
  {id:"false-color-infrared", title:"红外伪色", category:"色彩实验", description:"把红外信号映射到可见色彩。画面里的植被由绿转红，保留原有的山体明暗与层次。"},
  {id:"kaleidoscope", title:"万花筒", category:"图案构成", description:"镜像重复同一块画面，再围绕中心旋转。透明材质和反光会让对称图案更有层次。"},
  {id:"chromadepth-3d", title:"色差立体", category:"空间层次", description:"用不同色相组织前后关系。把高饱和色放在暗底上，可以清楚观察不同颜色形成的空间感。"},
  {id:"neon-sign-glow", title:"霓虹辉光", category:"光影效果", description:"让发亮的线条勾出轮廓，并把一点光晕留在周围。可以用在夜景、招牌和片名字效。"}
];

export const hints = {
  reference:["观察笔记","哪个视觉细节值得借鉴？比如构图、配色或文字层级。","复用说明","我想把这个细节用在哪类镜头？"],
  technique:["手法说明","标准名称是什么？画面里实际发生了什么？","参数与用途","写清对象、方向、时长、缓动和适合的镜头。"],
  style:["风格定位","适合什么内容？观众应该感受到什么？","风格规则","记录色彩、字体、构图、材质、光影和动效。写明固定项、可变项与避雷项。"]
};

export const sampleOrder = new Map(samples.map(({ id }, index) => [id, index]));

const builtinOriginalStyles = styleRecipes.map((item, position) => ({
  origin: "style",
  track: item.track,
  sourceLabel: item.sourceLabel,
  key: item.key,
  group: item.group,
  specimen: item.specimen,
  designMdFile: item.designMdFile || null,
  order: position,
  searchText: [item.key, item.title, item.group, item.sourceLabel, item.note, item.recipe, ...item.tags].join(" "),
  prompt: item.prompt,
  card: {
    id: `style-builtin-${item.key}`,
    type: "style",
    title: item.title,
    source: item.sourceUrl || "",
    tags: item.tags,
    note: item.note,
    recipe: item.recipe,
  },
}));

const builtinExternalStyles = externalStyleCatalog.map((item, position) => ({
  origin: item.origin,
  track: item.track,
  sourceLabel: item.sourceLabel,
  key: item.id,
  group: item.group,
  localImage: item.image || null,
  designMdFile: item.designMdFile || null,
  dynamicCover: item.cover || null,
  order: 100 + position,
  searchText: [item.id, item.title, item.group, item.sourceLabel, item.note, ...(item.tags || [])].join(" "),
  prompt: item.prompt,
  card: {
    id: `style-${item.id}`,
    type: "style",
    title: item.title,
    source: item.source || "",
    tags: item.tags || ["风格库"],
    note: item.note || "",
    recipe: item.recipe || "",
  },
}));

const builtinCatalogCards = Object.entries(referenceCatalog).flatMap(([origin, catalog]) => {
  const curated = new Map(Object.keys(catalog.selected).map((id, position) => [id, position]));
  const isAtlas = origin === "atlas";
  return catalog.rows.map(([key, english, group, source, originalGroup]) => {
    const annotation = catalog.selected[key];
    const zhFallback = isAtlas ? atlasZh[key] : null;
    const chinese = annotation?.[0] || zhFallback?.[0] || (!isAtlas && motion[key]?.[2]);
    return {
      origin,
      key,
      group,
      order: curated.get(key) ?? Infinity,
      searchText: [key, english, chinese, zhFallback?.[1], originalGroup].filter(Boolean).join(" "),
      prompt: isAtlas ? atlas[key]?.prompt : motion[key]?.[4],
      card: {
        id: `reference-${origin}-${key}`,
        type: isAtlas ? "reference" : "technique",
        title: chinese && chinese !== english ? `${chinese} · ${english}` : english,
        source,
        tags: [isAtlas ? "Atlas" : "Motion Prompt", group],
        note: annotation?.[1] || zhFallback?.[1] || (!isAtlas ? motion[key]?.[3] : "") || "",
        recipe: annotation?.[2] || "",
      },
    };
  });
}).sort((a, b) => a.order - b.order);

export const builtinCards = [...builtinOriginalStyles, ...builtinExternalStyles, ...builtinCatalogCards];

export const builtinById = new Map(builtinCards.map((entry) => [entry.card.id, entry]));
