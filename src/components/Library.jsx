import { useCallback, useMemo, useRef, useState } from "react";
import { motion as animation, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Dices,
  Download,
  ExternalLink,
  Heart,
  Layers3,
  LayoutTemplate,
  Monitor,
  Plus,
  Sparkles,
  Tag,
  Upload,
} from "lucide-react";
import { asset, atlas, builtinById, builtinCards, motion, names, sampleOrder, styleTracks } from "../library-data.js";
import { downloadDesignMdFile, sourceLink } from "../card-storage.js";
import { Maximize2 } from "lucide-react";
import { CatalogMedia, CopyButton } from "./Media.jsx";
import CardResources from "./CardResources.jsx";
import StyleSpecimen, { DynamicStyleCover } from "./StyleSpecimen.jsx";
import { Card, CardContent, CardFooter } from "./ui/Card.jsx";
import { FieldSelect, SearchField } from "./ui/Fields.jsx";
import { usePointerTilt } from "./usePointerTilt.js";

const pageSize = 24;
const characters = { reference: "参", technique: "技", style: "式" };
const origins = [
  { value: "", label: "所有来源" },
  { value: "own", label: "我的卡片" },
  { value: "atlas", label: "Atlas 图鉴" },
  { value: "motion", label: "Motion Prompt" },
  { value: "cookbook", label: "Prompt Cookbook" },
  { value: "moke-v25", label: "MOKE V25 风格" },
  { value: "moke-film", label: "MOKE 虚拟胶片" },
  { value: "design-md", label: "DESIGN.md 品牌" },
  { value: "ui-pro-max", label: "UI Pro Max" },
  { value: "style", label: "原创风格配方" },
];

const trackIcons = {
  ui: Monitor,
  graphic: LayoutTemplate,
  cinema: Camera,
  "ai-art": Sparkles,
};

function resolveStyleTrack(entry) {
  if (entry.builtin?.track) return entry.builtin.track;
  const tags = entry.card.tags || [];
  if (tags.includes("网页与产品 UI") || tags.includes("网页与界面") || tags.includes("DESIGN.md")) return "ui";
  if (tags.includes("摄影与电影镜头") || tags.includes("影像与胶片") || tags.includes("MOKE")) return "cinema";
  if (tags.includes("插画与 3D 画风") || tags.includes("生图与画风")) return "ai-art";
  return "graphic";
}

function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index);
  const pages = new Set([0, total - 1, current, current - 1, current + 1]);
  const sorted = [...pages].filter((page) => page >= 0 && page < total).sort((a, b) => a - b);
  const items = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push(`gap-${sorted[i - 1]}`);
    items.push(sorted[i]);
  }
  return items;
}

function entryImageMeta(entry) {
  const { card, builtin } = entry;
  const base = {
    id: card.id,
    title: card.title,
    note: card.note,
    source: sourceLink(card.source),
    designMdFile: builtin?.designMdFile || "",
  };
  if (card.image) {
    return { ...base, kind: "image", src: card.image, alt: card.title, prompt: card.recipe || "" };
  }
  if (builtin?.localImage) {
    return {
      ...base,
      kind: "image",
      src: asset(builtin.localImage),
      alt: card.title,
      prompt: builtin.prompt || card.recipe,
      credit: builtin.sourceLabel || "AI Visual Prompt Cookbook",
    };
  }
  if (builtin?.origin === "atlas" && atlas[builtin.key]?.local) {
    const item = atlas[builtin.key];
    return {
      ...base,
      kind: "image",
      src: asset(`atlas/参考图/${item.local}`),
      alt: item.title || card.title + "的视觉参考",
      prompt: item.prompt,
      source: item.source,
      credit: item.credit,
    };
  }
  if (builtin?.specimen) {
    return {
      ...base,
      kind: "specimen",
      specimen: builtin.specimen,
      prompt: builtin.prompt || card.recipe,
      credit: builtin.sourceLabel || "内置风格配方",
    };
  }
  if (builtin?.dynamicCover) {
    return {
      ...base,
      kind: "dynamicCover",
      dynamicCover: builtin.dynamicCover,
      prompt: builtin.prompt || card.recipe,
      credit: builtin.sourceLabel || "风格库",
    };
  }
  if (builtin?.origin === "motion" && motion[builtin.key]) {
    return {
      ...base,
      kind: "motion",
      motionEntry: builtin,
      prompt: builtin.prompt,
      credit: "Motion Prompt · Shohei Ohtaki · MIT",
    };
  }
  if (card.art) {
    return {
      ...base,
      kind: "art",
      art: card.art,
      prompt: card.recipe,
      credit: "视觉库示例",
    };
  }
  return null;
}

function Cover({ card, onOpenImage }) {
  if (card.image) {
    return (
      <div className="cover">
        <button type="button" className="image-link" aria-label={"查看大图 " + card.title} onClick={onOpenImage}>
          <img src={card.image} alt="" loading="lazy" />
          <span className="image-zoom-hint" aria-hidden="true"><Maximize2 size={13} /></span>
        </button>
      </div>
    );
  }
  const inner = card.art === "ref" ? <div className="art art-ref" aria-hidden="true">
      <div className="bar"><i /><i /><i /><i /></div><strong>章节导航</strong>
    </div>
    : card.art === "motion" ? <div className="art art-motion" aria-hidden="true">
      <div className="window"><strong>Mask Reveal</strong></div>
    </div>
    : card.art === "light" ? <div className="art art-light" aria-hidden="true"><div className="shape" /></div>
    : card.art === "paper" ? <div className="art art-paper" aria-hidden="true">
      <div className="plate"><strong>纸本编辑部</strong></div>
    </div>
    : <span className="placeholder" aria-hidden="true">{characters[card.type]}</span>;

  if (card.art && onOpenImage) {
    return (
      <div className="cover">
        <button type="button" className="image-link card-preview-trigger" aria-label={"放大查看 " + card.title} onClick={onOpenImage}>
          {inner}
          <span className="image-zoom-hint" aria-hidden="true"><Maximize2 size={13} /></span>
        </button>
      </div>
    );
  }
  return <div className="cover">{inner}</div>;
}

function LibraryCard({
  entry, index, reducedMotion, canEdit, playing, favorite,
  onToggleFavorite, onPlay, onEdit, onTag, onNotice, onOpenImage,
}) {
  const { card, builtin, edited } = entry;
  const isMotion = builtin?.origin === "motion" && Boolean(motion[builtin.key]);
  const isStyleSpecimen = Boolean(builtin?.specimen);
  const isDynamicCover = Boolean(builtin?.dynamicCover);
  const hasLocalStyleImage = Boolean(builtin?.localImage);
  const hasPreview = builtin && (isMotion || atlas[builtin.key]?.local);
  const source = sourceLink(card.source);
  const editLabel = builtin ? (edited ? "编辑笔记" : "添加笔记") : "查看与编辑";
  const isExternalStyle = card.type === "style" && Boolean(builtin);
  const description = [card.note, builtin && !isExternalStyle && card.recipe].filter(Boolean).join("\n") || card.recipe;
  const fallbackPrompt = !description && builtin?.prompt ? builtin.prompt : "";
  const styleCopy = card.type === "style" && (builtin?.prompt || card.recipe);
  const copyValue = styleCopy ? (builtin?.prompt || [card.title, card.note, card.recipe].filter(Boolean).join("\n\n")) : builtin?.prompt;
  const hasCredit = Boolean(hasPreview && !card.image);
  const provider = builtin
    ? (builtin.sourceLabel || (builtin.origin === "atlas" ? "Atlas" : `Motion #${builtin.key}`))
    : card.sample ? "示例" : null;
  const styleTrack = card.type === "style" ? resolveStyleTrack(entry) : undefined;

  const styleTrackLabel = styleTrack ? styleTracks.find((t) => t.id === styleTrack)?.label : "";
  const kindLabel = builtin?.group || styleTrackLabel || names[card.type];
  const dedupedTags = card.tags.filter((tag) => tag !== kindLabel && tag !== "风格库" && !tag.startsWith("design-md:"));
  const displayTags = (dedupedTags.length ? dedupedTags : card.tags.filter((tag) => !tag.startsWith("design-md:"))).slice(0, 4);
  const hiddenTags = (dedupedTags.length ? dedupedTags : card.tags.filter((tag) => !tag.startsWith("design-md:"))).slice(4);

  const [hoverPlay, setHoverPlay] = useState(false);
  const togglePlayback = useCallback(() => {
    setHoverPlay(false);
    onPlay(card.id);
  }, [card.id, onPlay]);
  const pointer = usePointerTilt(3.5);

  return (
    <Card as={animation.article} data-entry={builtin?.key} data-card-type={card.type}
      data-style-track={styleTrack}
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.08 }}
      transition={reducedMotion ? { duration: 0 } : {
        duration: 0.48, ease: [0.22, 1, 0.36, 1], delay: (index % 4) * 0.035,
      }}
      onPointerEnter={isMotion && !reducedMotion ? (event) => {
        if (event.pointerType === "mouse") setHoverPlay(true);
      } : undefined}
      onPointerLeave={isMotion ? () => setHoverPlay(false) : undefined}>
      <div className="card-media" {...pointer}>
        <div className="card-media-surface">
          {!card.image && hasLocalStyleImage
            ? <figure className="entry-media">
                <div className="image-stage">
                  <button type="button" className="image-link" aria-label={"查看大图 " + card.title} onClick={onOpenImage}>
                    <img src={asset(builtin.localImage)} alt={card.title} loading="lazy" decoding="async" />
                    <span className="image-zoom-hint" aria-hidden="true"><Maximize2 size={13} /></span>
                  </button>
                </div>
              </figure>
            : !card.image && isStyleSpecimen
              ? <button type="button" className="image-link card-preview-trigger" aria-label={"放大查看 " + card.title} onClick={onOpenImage}>
                  <StyleSpecimen kind={builtin.specimen.kind} />
                  <span className="image-zoom-hint" aria-hidden="true"><Maximize2 size={13} /></span>
                </button>
              : !card.image && isDynamicCover
                ? <button type="button" className="image-link card-preview-trigger" aria-label={"放大查看 " + card.title} onClick={onOpenImage}>
                    <DynamicStyleCover cover={builtin.dynamicCover} />
                    <span className="image-zoom-hint" aria-hidden="true"><Maximize2 size={13} /></span>
                  </button>
                : !card.image && hasPreview
                  ? <CatalogMedia entry={builtin} title={card.title} playing={playing || hoverPlay}
                      onPlay={togglePlayback} onImage={onOpenImage} />
                  : <Cover card={card} onOpenImage={onOpenImage} />}
          <span className="card-media-glare" aria-hidden="true" />
        </div>
        <button type="button" className={`card-fav-btn ${favorite ? "is-fav" : ""}`}
          aria-label={favorite ? `取消收藏 ${card.title}` : `收藏 ${card.title}`}
          aria-pressed={favorite}
          title={favorite ? "取消收藏" : "加入收藏"}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite(card.id);
          }}>
          <Heart size={14} fill={favorite ? "currentColor" : "none"} aria-hidden="true" />
        </button>
      </div>
      <CardContent>
        <div className="kind">
          <span className="card-kind">{kindLabel}</span>
          {(provider || card.time) && <span className="card-origin">{[provider, card.time].filter(Boolean).join(" · ")}</span>}
        </div>
        <h3 className="card-title" title={card.title}>{card.title}</h3>
        {description
          ? <p className="description">{description}</p>
          : fallbackPrompt
            ? <p className="description description-prompt">{fallbackPrompt}</p>
            : null}
        {displayTags.length > 0 && (
          <div className="labels">
            {displayTags.map((tag) =>
              <button type="button" className="label" key={tag} title={tag} onClick={() => onTag(tag)}>{tag}</button>)}
            {hiddenTags.length > 0 && (
              <span className="label label-more" title={hiddenTags.join(" · ")}>+{hiddenTags.length}</span>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <button type="button" className="plain" aria-label={editLabel + " " + card.title}
          disabled={!canEdit} onClick={() => onEdit(entry)}>
          <span>{editLabel}</span>
          <ArrowUpRight size={13} className="plain-arrow" aria-hidden="true" />
        </button>
        <div className="card-tools">
          {copyValue && <CopyButton value={copyValue} label={styleCopy ? "复制风格配置" : "复制提示词"}
            iconOnly onNotice={onNotice} />}
          {builtin?.designMdFile && (
            <button type="button" className="card-tool card-tool-icon"
              title="下载完整 DESIGN.md 规范文件" aria-label="下载完整 DESIGN.md 规范文件"
              onClick={async () => {
                const slug = builtin.designMdFile.split("/").pop() || "DESIGN.md";
                const filename = slug.endsWith(".md") ? `${slug.replace(/\.md$/, "")}-DESIGN.md` : "DESIGN.md";
                try {
                  await downloadDesignMdFile(asset(builtin.designMdFile), filename);
                  onNotice(`已触发下载 ${filename}。`);
                } catch (error) {
                  onNotice(error.message || "下载 DESIGN.md 失败。");
                }
              }}>
              <Download size={14} aria-hidden="true" />
            </button>
          )}
          {builtin && (builtin.prompt || hasCredit) &&
            <CardResources entry={builtin} title={card.title} hasCredit={hasCredit} />}
          {source && <a className="card-tool card-tool-icon" href={source} target="_blank" rel="noreferrer"
            title={card.time ? "查看来源 · " + card.time : "查看来源"}
            aria-label={card.time ? "查看来源，时间码 " + card.time : "查看来源"}>
            <ExternalLink size={14} aria-hidden="true" />
          </a>}
        </div>
      </CardFooter>
    </Card>
  );
}

export default function Library({
  cards, filters, setFilter, page, setPage, storage, favorites, onToggleFavorite,
  onEdit, onNew, onInspiration, onImport, onExport, onBrowse, onNotice, onImage, playing, onPlay,
}) {
  const input = useRef(null);
  const reducedMotion = useReducedMotion();
  const canEdit = storage === "sqlite" || storage === "postgres" || storage === "migration-warning";

  const entries = useMemo(() => {
    const stored = new Map(cards.map((card) => [card.id, card]));
    const custom = cards.filter((card) => !builtinById.has(card.id)).sort((a, b) =>
      b.updated - a.updated || (sampleOrder.get(a.id) ?? 99) - (sampleOrder.get(b.id) ?? 99) || a.id.localeCompare(b.id));
    return [
      ...custom.map((card) => ({ card, edited: true })),
      ...builtinCards.map((builtin) => ({ builtin, card: stored.get(builtin.card.id) || builtin.card, edited: stored.has(builtin.card.id) })),
    ];
  }, [cards]);

  const originScoped = useMemo(() => entries.filter(({ card, builtin, edited }) =>
    (!filters.origin || (filters.origin === "own" ? edited : builtin?.origin === filters.origin)) &&
    (!filters.fav || favorites.has(card.id))), [entries, filters.origin, filters.fav, favorites]);

  const counts = useMemo(() => {
    const map = { all: originScoped.length, reference: 0, technique: 0, style: 0 };
    for (const { card } of originScoped) {
      if (card.type in map) map[card.type]++;
    }
    return map;
  }, [originScoped]);

  const styleEntries = useMemo(() => originScoped.filter(({ card }) => card.type === "style"), [originScoped]);

  const trackCounts = useMemo(() => {
    const map = { all: styleEntries.length, ui: 0, graphic: 0, cinema: 0, "ai-art": 0 };
    for (const entry of styleEntries) {
      const tr = resolveStyleTrack(entry);
      if (tr in map) map[tr]++;
    }
    return map;
  }, [styleEntries]);

  const activeTrack = filters.type === "style" ? (filters.track || "all") : "all";

  const scoped = useMemo(() => originScoped.filter((entry) =>
    (filters.type === "all" || entry.card.type === filters.type) &&
    (activeTrack === "all" || resolveStyleTrack(entry) === activeTrack)), [originScoped, filters.type, activeTrack]);

  const tags = useMemo(() => [...new Set(scoped.flatMap(({ card }) => card.tags))].sort((a, b) => a.localeCompare(b, "zh-CN")), [scoped]);
  const tag = tags.includes(filters.tag) ? filters.tag : "";

  const results = useMemo(() => {
    const words = filters.search.toLowerCase().trim().split(/\s+/).filter(Boolean).map((word) => word.replace(/^#(?=\d)/, ""));
    return scoped.filter(({ card, builtin }) => {
      if (tag && !card.tags.includes(tag)) return false;
      const text = [card.title, card.note, card.recipe, ...card.tags, builtin?.searchText].join(" ").toLowerCase();
      return words.every((word) => text.includes(word));
    });
  }, [scoped, filters.search, tag]);

  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const displayedPage = Math.min(page, pageCount - 1);
  const pageStart = displayedPage * pageSize;
  const pageSlice = results.slice(pageStart, pageStart + pageSize);

  const pageGallery = useMemo(() => pageSlice.map(entryImageMeta).filter(Boolean), [pageSlice]);

  function openGalleryFor(entry) {
    const target = entryImageMeta(entry);
    if (!target) return;
    const idx = pageGallery.findIndex((item) => item.id === target.id);
    if (idx >= 0) onImage({ items: pageGallery, index: idx });
    else onImage({ items: [target], index: 0 });
  }

  function goToPage(nextPage) {
    setPage(nextPage);
    onBrowse();
  }

  return (
    <div className="library-shell" id="personal-view">
      <div className="wrap library">
        <section aria-labelledby="personal-title">
          <div className="library-heading">
            <div className="library-heading-copy">
              <h2 id="personal-title" tabIndex="-1">我的卡片</h2>
              <p className="results" aria-live="polite">{results.length} 张灵感卡片</p>
            </div>
            <div className="actions">
              <button className="btn btn-inspiration" type="button" onClick={() => onInspiration(entries)}>
                <Dices size={15} aria-hidden="true" /><span>灵感盲盒</span>
              </button>
              <button className="btn btn-subtle" type="button" disabled={!canEdit}
                title="导入 JSON 备份" onClick={() => input.current.click()}>
                <Upload size={14} aria-hidden="true" /><span>导入</span>
              </button>
              <button className="btn btn-subtle" type="button" disabled={!canEdit}
                title="导出 JSON 备份" onClick={onExport}>
                <Download size={14} aria-hidden="true" /><span>导出</span>
              </button>
              <button className="btn primary" type="button" disabled={!canEdit} onClick={onNew}>
                <Plus size={15} aria-hidden="true" /><span>新建卡片</span>
              </button>
              <input ref={input} id="backup-file" type="file" accept=".json,application/json" hidden onChange={(event) => {
                const file = event.target.files[0];
                event.target.value = "";
                if (file) onImport(file);
              }} />
            </div>
          </div>

          {storage === "offline" && <p className="storage-status" role="status">数据库服务未连接，请检查本地服务或网络。</p>}
          {storage === "static" && <p className="storage-status" role="status">当前为在线只读预览模式；如需新增卡片或启用 MCP，请在本地运行。</p>}
          {storage === "migration-warning" && <p className="storage-status" role="status">此浏览器的旧数据未自动导入。可以刷新重试，或在旧版导出 JSON 后导入。</p>}

          <div className="controls">
            <div className="tabs-group">
              <nav className="tabs" aria-label="卡片分类">
                {Object.entries({ all: "全部", ...names }).map(([value, label]) => {
                  const isSelected = filters.type === value;
                  return (
                    <button className="tab" key={value} type="button" aria-pressed={isSelected}
                      onClick={() => setFilter("type", value)}>
                      {isSelected && (
                        <animation.span className="tab-pill" layoutId="library-tab-active"
                          transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }} />
                      )}
                      <span className="tab-label">{label}</span>
                      <span className="tab-count">{counts[value] ?? 0}</span>
                    </button>
                  );
                })}
              </nav>
              <button type="button" className={`fav-filter-btn ${filters.fav ? "is-active" : ""}`}
                aria-pressed={Boolean(filters.fav)}
                onClick={() => setFilter("fav", !filters.fav)}>
                <Heart size={13} fill={filters.fav ? "currentColor" : "none"} aria-hidden="true" />
                <span>收藏</span>
                {favorites.size > 0 && <span className="fav-filter-count">{favorites.size}</span>}
              </button>
            </div>
            <div className="library-filters">
              <SearchField value={filters.search} onChange={(value) => setFilter("search", value)} />
              <FieldSelect id="tag" label="筛选标签" icon={Tag} value={tag}
                options={[{ value: "", label: "所有标签" }, ...tags.map((value) => ({ value, label: value }))]}
                onChange={(value) => setFilter("tag", value)} />
              <FieldSelect id="card-origin" label="筛选来源" icon={Layers3} value={filters.origin}
                options={origins} onChange={(value) => setFilter("origin", value)} />
            </div>
          </div>

          {filters.type === "style" && (
            <nav className="style-track-bar" aria-label="风格赛道筛选">
              {styleTracks.map((track) => {
                const Icon = trackIcons[track.id];
                const selected = activeTrack === track.id;
                return (
                  <button key={track.id} type="button"
                    className={`style-track-pill ${selected ? "is-selected" : ""}`}
                    data-track={track.id}
                    aria-pressed={selected}
                    onClick={() => setFilter("track", track.id)}>
                    {Icon && <Icon size={14} aria-hidden="true" />}
                    <span>{track.label}</span>
                    <span className="style-track-count">{trackCounts[track.id] ?? 0}</span>
                  </button>
                );
              })}
            </nav>
          )}

          <div className="grid" id="grid">
            {pageSlice.map((entry, index) => (
              <LibraryCard key={entry.card.id} entry={entry} index={index}
                reducedMotion={reducedMotion} canEdit={canEdit} playing={playing === entry.card.id}
                favorite={favorites.has(entry.card.id)} onToggleFavorite={onToggleFavorite}
                onPlay={onPlay} onEdit={onEdit} onTag={(value) => setFilter("tag", value)}
                onOpenImage={() => openGalleryFor(entry)} onNotice={onNotice} />
            ))}
          </div>

          {!results.length && <p className="empty">{filters.fav ? "还没有收藏符合条件的卡片，点击任意卡片左上角爱心即可收藏。" : "没有符合条件的卡片。可以调整筛选条件或新建一张。"}</p>}

          {pageCount > 1 && (
            <div className="catalog-pagination">
              <span className="pagination-summary">第 {displayedPage + 1} / {pageCount} 页</span>
              <div className="pagination-controls">
                <button className="btn page-btn" type="button" disabled={!displayedPage}
                  onClick={() => goToPage(displayedPage - 1)}>
                  <ChevronLeft size={15} aria-hidden="true" /><span>上一页</span>
                </button>
                <div className="page-numbers" aria-label="页码">
                  {pageList(displayedPage, pageCount).map((item) =>
                    typeof item === "string"
                      ? <span key={item} className="page-gap" aria-hidden="true">…</span>
                      : <button key={item} type="button" className="page-num"
                          aria-current={item === displayedPage ? "page" : undefined}
                          onClick={() => goToPage(item)}>{item + 1}</button>
                  )}
                </div>
                <button className="btn page-btn" type="button" disabled={displayedPage === pageCount - 1}
                  onClick={() => goToPage(displayedPage + 1)}>
                  <span>下一页</span><ChevronRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
