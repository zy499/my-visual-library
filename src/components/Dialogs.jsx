import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, BookmarkPlus, Check, ChevronLeft, ChevronRight, Copy, Dices, Download, ExternalLink, Eye, EyeOff, Heart, ImagePlus, KeyRound, Lock, LockOpen, Plug, RefreshCw, RotateCcw, ShieldCheck, Sparkles, Trash2, X } from "lucide-react";
import { asset, builtinById, hints, names } from "../library-data.js";
import { copyDesignMdFile, copyText, downloadDesignMdFile, imageData, sourceLink } from "../card-storage.js";
import { AtlasPreview, CatalogMedia, CopyButton } from "./Media.jsx";
import StyleSpecimen, { DynamicStyleCover } from "./StyleSpecimen.jsx";
import { FieldSelect, Input } from "./ui/Fields.jsx";

export function Dialog({ title, onClose, children, id, className, headerExtra }) {
  const dialog = useRef(null);
  useLayoutEffect(() => {
    const node = dialog.current;
    node.showModal();
    node.querySelector("[data-dialog-focus]")?.focus({ preventScroll: true });
    return () => { if (node.open) node.close(); };
  }, []);

  return (
    <dialog id={id} ref={dialog} className={className} aria-labelledby={id + "-title"}
      onClick={(event) => {
        if (event.target === dialog.current) dialog.current.close();
      }}
      onClose={(event) => { if (!event.currentTarget.open) onClose(); }}>
      <div className="dialog-surface">
        <div className="dialog-head">
          <div className="dialog-title-wrap">
            <h2 id={id + "-title"}>{title}</h2>
            {headerExtra}
          </div>
          <button className="dialog-close" type="button" aria-label="关闭" onClick={() => dialog.current.close()}>
            <X size={17} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export function ImageLightbox({ state, onClose, onNavigate, onNotice, isFavorite, onToggleFavorite }) {
  const { items, index } = state;
  const current = items[index] || items[0];
  const hasGallery = items.length > 1;
  const starred = current?.id ? isFavorite(current.id) : false;
  const [motionPlaying, setMotionPlaying] = useState(true);
  const [copiedFullMd, setCopiedFullMd] = useState(false);
  const [downloadedMd, setDownloadedMd] = useState(false);

  useEffect(() => {
    setMotionPlaying(true);
    setCopiedFullMd(false);
    setDownloadedMd(false);
  }, [current?.id]);

  async function handleDownloadDesignMd() {
    if (!current?.designMdFile) return;
    const slug = current.designMdFile.split("/").pop() || "DESIGN.md";
    const filename = slug.endsWith(".md") ? `${slug.replace(/\.md$/, "")}-DESIGN.md` : "DESIGN.md";
    try {
      await downloadDesignMdFile(asset(current.designMdFile), filename);
      setDownloadedMd(true);
      setTimeout(() => setDownloadedMd(false), 2200);
      onNotice(`已触发下载 ${filename}（放入项目根目录即可供 AI 读取）。`);
    } catch (error) {
      onNotice(error.message || "下载 DESIGN.md 失败。");
    }
  }

  async function handleCopyFullDesignMd() {
    if (!current?.designMdFile) return;
    try {
      const { ok, chars } = await copyDesignMdFile(asset(current.designMdFile));
      if (ok) {
        setCopiedFullMd(true);
        setTimeout(() => setCopiedFullMd(false), 2000);
        onNotice(`已复制完整 DESIGN.md 规范（${chars.toLocaleString()} 字符），可直接贴给 AI 执行。`);
      } else {
        onNotice("浏览器未允许访问剪贴板。");
      }
    } catch (error) {
      onNotice(error.message || "读取完整 DESIGN.md 失败。");
    }
  }

  useEffect(() => {
    if (!hasGallery) return;
    function onKey(event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onNavigate((index - 1 + items.length) % items.length);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onNavigate((index + 1) % items.length);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasGallery, index, items.length, onNavigate]);

  if (!current) return null;

  return (
    <Dialog id="image-dialog" className="lightbox-dialog" title={current.title} onClose={onClose}
      headerExtra={hasGallery && <span className="lightbox-counter">{index + 1} / {items.length}</span>}>
      <div className="lightbox-stage">
        {hasGallery && (
          <button type="button" className="lightbox-nav lightbox-nav-prev" aria-label="上一张"
            onClick={() => onNavigate((index - 1 + items.length) % items.length)}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        )}
        {current.specimen ? (
          <div className="lightbox-specimen">
            <StyleSpecimen kind={current.specimen.kind} />
          </div>
        ) : current.dynamicCover ? (
          <div className="lightbox-specimen">
            <DynamicStyleCover cover={current.dynamicCover} />
          </div>
        ) : current.motionEntry ? (
          <div className="lightbox-motion">
            <CatalogMedia entry={current.motionEntry} title={current.title}
              playing={motionPlaying} onPlay={() => setMotionPlaying((p) => !p)} />
          </div>
        ) : current.art ? (
          <div className="lightbox-specimen">
            <div className="cover">
              {current.art === "ref" ? <div className="art art-ref"><div className="bar"><i /><i /><i /><i /></div><strong>章节导航</strong></div>
                : current.art === "motion" ? <div className="art art-motion"><div className="window"><strong>Mask Reveal</strong></div></div>
                : current.art === "light" ? <div className="art art-light"><div className="shape" /></div>
                : <div className="art art-paper"><div className="plate"><strong>{current.title}</strong></div></div>}
            </div>
          </div>
        ) : (
          <img id="image-dialog-preview" src={current.src} alt={current.alt || current.title} />
        )}
        {hasGallery && (
          <button type="button" className="lightbox-nav lightbox-nav-next" aria-label="下一张"
            onClick={() => onNavigate((index + 1) % items.length)}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        )}
      </div>
      {(current.note || current.prompt || current.source || current.id) && (
        <div className="lightbox-footer">
          <div className="lightbox-meta">
            {current.note && <p className="lightbox-note">{current.note}</p>}
            {current.prompt && <p className="lightbox-prompt">{current.prompt}</p>}
            {current.credit && <span className="lightbox-credit">来源 · {current.credit}</span>}
          </div>
          <div className="lightbox-actions">
            {current.id && (
              <button type="button" className={`btn ${starred ? "btn-fav-active" : ""}`}
                aria-pressed={starred} onClick={() => onToggleFavorite(current.id)}>
                <Heart size={14} fill={starred ? "currentColor" : "none"} aria-hidden="true" />
                <span>{starred ? "已收藏" : "收藏"}</span>
              </button>
            )}
            {current.designMdFile && (
              <>
                <button type="button" className="btn" onClick={handleDownloadDesignMd}
                  title="下载完整 DESIGN.md 规范文件">
                  {downloadedMd ? <Check size={14} aria-hidden="true" /> : <Download size={14} aria-hidden="true" />}
                  <span>{downloadedMd ? "已下载" : "下载 DESIGN.md"}</span>
                </button>
                <button type="button" className="btn primary" onClick={handleCopyFullDesignMd}
                  title="复制完整 DESIGN.md 原文（含全部 Token、组件与代码规则）">
                  {copiedFullMd ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                  <span>{copiedFullMd ? "已复制完整规范" : "复制完整规范"}</span>
                </button>
              </>
            )}
            {current.prompt && !current.designMdFile && <CopyButton value={current.prompt} label="复制提示词" onNotice={onNotice} />}
            {current.source && (
              <a className="btn" href={current.source} target="_blank" rel="noreferrer">
                原站 <ExternalLink size={13} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

const inspirationModes = [
  { id: "ui", label: "网页 / UI", tools: "Cursor · Claude · Antigravity · v0", placeholder: "输入页面主题（如：AI 音乐播客首页 / 个人作品集）" },
  { id: "graphic", label: "海报 / 封面", tools: "即梦 · GPT Image · Midjourney · Nano Banana", placeholder: "输入海报主题（如：秋季手冲咖啡市集 / 播客单集封面）" },
  { id: "cinema", label: "视频 / 分镜", tools: "可灵 · 即梦视频 · Runway · Sora", placeholder: "输入镜头画面（如：雨夜霓虹街头穿风衣的人回眸）" },
  { id: "ai-art", label: "AI 生图 / 3D", tools: "即梦 · Flux · Midjourney · GPT Image", placeholder: "输入画面主体（如：悬浮在云端的迷你书店 / 奶油小猫）" },
  { id: "all", label: "自由混搭", tools: "综合创意参考 · 跨媒介头脑风暴", placeholder: "输入你的创作主题（可选）" },
];

function englishName(title) {
  const parts = (title || "").split(" · ");
  return parts.length > 1 ? parts[1].trim() : parts[0].trim();
}

function inferStyleTrack(entry) {
  if (entry?.builtin?.track) return entry.builtin.track;
  const tags = entry?.card?.tags || [];
  if (tags.includes("网页与产品 UI") || tags.includes("DESIGN.md")) return "ui";
  if (tags.includes("摄影与电影镜头") || tags.includes("MOKE")) return "cinema";
  if (tags.includes("插画与 3D 画风")) return "ai-art";
  return "graphic";
}

function extractStylePromptBody(promptText, fallbackNote = "") {
  if (!promptText) return fallbackNote.trim();
  // Cookbook structured prompts: extract the actual "Style direction:" + key "Keep visible:" rules
  const dirMatch = promptText.match(/Style direction:\s*\n([\s\S]*?)(?=\n\n(?:Keep visible:|Avoid:)|$)/i);
  if (dirMatch) {
    const direction = dirMatch[1].replace(/\s+/g, " ").trim();
    const keepMatch = promptText.match(/Keep visible:\s*\n([\s\S]*?)(?=\n\nAvoid:|$)/i);
    const keepBullets = keepMatch
      ? keepMatch[1]
          .split("\n")
          .map((line) => line.replace(/^-\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 3)
          .join(" ")
      : "";
    return [direction, keepBullets].filter(Boolean).join(" ").trim();
  }
  // Bilingual MOKE V25 prompts: prefer the first English paragraph when present
  const firstBlock = promptText.split(/\n\n+/)[0]?.trim() || promptText.trim();
  if (/^[A-Za-z0-9"']/.test(firstBlock) && firstBlock.length > 40) {
    return firstBlock.replace(/\s+/g, " ").trim();
  }
  return promptText.replace(/\s+/g, " ").trim();
}

function buildCombinedBrief(trio, mode, subject) {
  const [refSlot, motionSlot, styleSlot] = trio;
  const refCard = refSlot?.entry?.card;
  const refPrompt = (refSlot?.entry?.builtin?.prompt || "").replace(/\s+/g, " ").trim();
  const motionCard = motionSlot?.entry?.card;
  const motionPrompt = (motionSlot?.entry?.builtin?.prompt || "").trim();
  const styleCard = styleSlot?.entry?.card;
  const stylePrompt = styleSlot?.entry?.builtin?.prompt || styleCard?.recipe || "";
  const topic = subject.trim();
  const effectiveMode = mode === "all" ? inferStyleTrack(styleSlot?.entry) : mode;

  if (effectiveMode === "ui") {
    return [
      `请帮我设计并实现一个「${topic || "现代创意产品页面"}」的前端界面：`,
      styleCard ? `\n1. 整体 UI 设计系统（以下规范已自包含，直接按此执行即可，无需外部查找）：\n${(stylePrompt || styleCard.note || "").trim()}` : "",
      refCard ? `\n2. 局部视觉质感点缀：在主视觉头图或特色卡片中克制融入「${refCard.title}」（${refCard.note}），保持正文高对比度清晰可读。` : "",
      motionCard ? `\n3. 核心交互与动效：重点实现「${motionCard.title}」\n${motionPrompt || motionCard.note}` : "",
      `\n【落地要求】保持整体配色统一、留白舒展、交互流畅并做好桌面与移动端响应式适配。`,
    ].filter(Boolean).join("\n");
  }

  if (effectiveMode === "cinema") {
    const styleBody = extractStylePromptBody(stylePrompt, styleCard?.note || "");
    const enMove = englishName(motionCard?.title);
    const motionSpecLine = motionPrompt.match(/What the sample shows:\s*(.+)/)?.[1] || motionCard?.note || "";
    return [
      `【镜头画面】${topic || "（在此填写你的镜头主体与场景，如：雨夜街头穿风衣的人回眸）"}`,
      styleCard ? `【电影与胶片预设】${styleCard.title}${styleCard.note ? ` — ${styleCard.note}` : ""}` : "",
      motionCard ? `【运镜与光影节奏】${motionCard.title}（${motionCard.note}）` : "",
      refCard ? `【光学质感参考】${refCard.title}（${refCard.note}）` : "",
      `\n--- 可直接复制的视频 / 分镜 Prompt（可直贴可灵 / 即梦视频 / Runway / Sora）---`,
      `${topic ? `${topic}. ` : ""}${enMove ? `Camera & motion: ${enMove}${motionSpecLine ? ` (${motionSpecLine})` : ""}. ` : ""}${styleBody ? `Visual style: ${styleBody} ` : ""}${refPrompt ? `Optical treatment: ${refPrompt}` : ""}`.trim(),
    ].filter(Boolean).join("\n");
  }

  // graphic (海报/封面) & ai-art (AI 生图/3D)
  const styleBody = extractStylePromptBody(stylePrompt, styleCard?.note || "");
  const enRef = englishName(refCard?.title);
  const enArt = englishName(motionCard?.title);
  return [
    `【画面主体】${topic || (effectiveMode === "graphic" ? "（在此填写海报标题与主体，如：秋季手冲咖啡市集海报）" : "（在此填写画面主体，如：云端漂浮的迷你书店）")}`,
    styleCard ? `【核心风格基底】${styleCard.title}${styleCard.note ? ` — ${styleCard.note}` : ""}` : "",
    refCard ? `【材质与视觉效果】融入「${refCard.title}」（${refCard.note}）` : "",
    motionCard ? `【构图与光影参考】${motionCard.title}（${motionCard.note}）` : "",
    `\n--- 可直接复制的生图 Prompt（可直贴即梦 / GPT Image / Midjourney / Flux）---`,
    `${topic ? `${topic}. ` : ""}${styleBody}${enRef ? ` Subtle ${enRef} visual texture.` : ""}${enArt ? ` Inspired by ${enArt} visual framing.` : ""} Cohesive color palette, high aesthetic craft, clean focal hierarchy.`.trim(),
  ].filter(Boolean).join("\n");
}

export function InspirationDialog({
  trio, mode, locks, onModeChange, onToggleLock, onRerollSlot,
  onShuffle, onSaveDraft, canSave, onClose, onJump, onNotice, isFavorite, onToggleFavorite,
}) {
  const [playingMotion, setPlayingMotion] = useState(true);
  const [subject, setSubject] = useState("");
  const [showBrief, setShowBrief] = useState(true);

  const activeModeMeta = inspirationModes.find((m) => m.id === mode) || inspirationModes[0];
  const combinedBrief = useMemo(() => buildCombinedBrief(trio, mode, subject), [trio, mode, subject]);
  const styleDesignMdFile = trio[2]?.entry?.builtin?.designMdFile || "";

  function handleSaveAsStyleCard() {
    const styleCard = trio[2]?.entry?.card;
    const refCard = trio[0]?.entry?.card;
    const motionCard = trio[1]?.entry?.card;
    const shortStyle = styleCard?.title?.split(" · ")[0] || "混搭风格";
    const shortRef = refCard?.title?.split(" · ")[0] || "";
    const shortMotion = motionCard?.title?.split(" · ")[0] || "";
    const trackTag = mode === "ui" ? "网页与产品 UI"
      : mode === "cinema" ? "摄影与电影镜头"
      : mode === "ai-art" ? "插画与 3D 画风"
      : "平面与海报排版";

    onSaveDraft({
      type: "style",
      title: subject.trim() ? `${subject.trim()} · ${shortStyle}` : `${shortStyle} × ${shortRef}`,
      source: "",
      time: "",
      tags: [...new Set(["灵感混搭", trackTag, shortStyle, shortRef, shortMotion].filter(Boolean))].slice(0, 6),
      note: `由灵感盲盒融合生成：${[shortStyle, shortRef, shortMotion].filter(Boolean).join(" + ")}。`,
      recipe: combinedBrief,
    });
  }

  return (
    <Dialog id="inspiration-dialog" className="inspiration-dialog" title="灵感盲盒 · 创意合成台" onClose={onClose}
      headerExtra={<span className="inspiration-badge"><Sparkles size={12} aria-hidden="true" />锁定喜欢的卡，一键合成 AI 指令</span>}>
      <div className="inspiration-body">
        <div className="inspiration-mode-bar" role="group" aria-label="选择创作场景">
          <span className="inspiration-mode-label">创作场景</span>
          <div className="inspiration-modes">
            {inspirationModes.map((item) => (
              <button key={item.id} type="button"
                className={`inspiration-mode-btn ${mode === item.id ? "is-active" : ""}`}
                aria-pressed={mode === item.id}
                onClick={() => onModeChange(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="inspiration-grid">
          {trio.map(({ slot, entry }, idx) => {
            const { card, builtin } = entry;
            const starred = isFavorite(card.id);
            const locked = Boolean(locks?.[idx]);
            return (
              <article key={`${idx}-${card.id}`} className={`inspiration-item ${locked ? "is-locked" : ""}`} data-card-type={card.type}>
                <div className="inspiration-slot">
                  <span>{slot}</span>
                  <div className="inspiration-slot-tools">
                    <button type="button" className={`card-fav-inline ${locked ? "is-locked" : ""}`}
                      aria-label={locked ? "取消锁定此格" : "锁定此格不参与重抽"}
                      aria-pressed={locked}
                      title={locked ? "已锁定（重抽时保留）" : "锁定这张卡"}
                      onClick={() => onToggleLock(idx)}>
                      {locked ? <Lock size={13} aria-hidden="true" /> : <LockOpen size={13} aria-hidden="true" />}
                    </button>
                    <button type="button" className="card-fav-inline"
                      aria-label="单独重抽这一格" title="单张换一个"
                      onClick={() => onRerollSlot(idx)}>
                      <RefreshCw size={13} aria-hidden="true" />
                    </button>
                    <button type="button" className={`card-fav-inline ${starred ? "is-fav" : ""}`}
                      aria-label={starred ? "取消收藏" : "收藏"} aria-pressed={starred}
                      title={starred ? "取消收藏" : "收藏"}
                      onClick={() => onToggleFavorite(card.id)}>
                      <Heart size={13} fill={starred ? "currentColor" : "none"} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="inspiration-media">
                  {builtin?.localImage
                    ? <figure className="entry-media">
                        <div className="image-stage">
                          <img src={asset(builtin.localImage)} alt={card.title} loading="lazy" />
                        </div>
                      </figure>
                    : builtin?.specimen
                      ? <StyleSpecimen kind={builtin.specimen.kind} />
                      : builtin?.dynamicCover
                        ? <DynamicStyleCover cover={builtin.dynamicCover} />
                        : builtin
                          ? <CatalogMedia entry={builtin} title={card.title}
                              playing={builtin.origin === "motion" ? playingMotion : false}
                              onPlay={() => setPlayingMotion((p) => !p)}
                              onImage={() => onJump(card)} />
                          : card.art === "paper"
                            ? <div className="art art-paper" aria-hidden="true"><div className="plate"><strong>{card.title}</strong></div></div>
                            : <div className="cover"><span className="placeholder">{card.title.slice(0, 1)}</span></div>}
                </div>
                <div className="inspiration-copy">
                  <h3>{card.title}</h3>
                  <p>{card.note || card.recipe}</p>
                </div>
                <div className="inspiration-item-actions">
                  <button type="button" className="plain" onClick={() => onJump(card)}>定位卡片 ↗</button>
                  {(builtin?.prompt || card.recipe) && (
                    <CopyButton value={builtin?.prompt || card.recipe} label="复制单卡提示词" shortLabel="复制" onNotice={onNotice} />
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="inspiration-composer">
          <div className="inspiration-tool-hint">
            <span className="inspiration-tool-pill">推荐发给</span>
            <span>{activeModeMeta.tools}</span>
          </div>
          <div className="inspiration-composer-top">
            <input
              type="text"
              className="field-input inspiration-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder={activeModeMeta.placeholder}
              aria-label="创作主题"
            />
            <button type="button" className="btn btn-subtle" onClick={() => setShowBrief((v) => !v)}>
              {showBrief ? "收起指令" : "展开指令"}
            </button>
          </div>
          {showBrief && (
            <pre className="inspiration-brief-preview">{combinedBrief}</pre>
          )}
          <div className="inspiration-footer">
            <button type="button" className="btn" onClick={onShuffle}>
              <Dices size={15} aria-hidden="true" />
              <span>{Object.values(locks || {}).some(Boolean) ? "重抽未锁定卡" : "再抽一组"}</span>
            </button>
            <div className="actions">
              {styleDesignMdFile && (
                <button type="button" className="btn"
                  title="下载完整 DESIGN.md 文件（放到项目根目录即可供 Cursor / Claude / Antigravity 读取）"
                  onClick={async () => {
                    const slug = styleDesignMdFile.split("/").pop() || "DESIGN.md";
                    const filename = slug.endsWith(".md") ? `${slug.replace(/\.md$/, "")}-DESIGN.md` : "DESIGN.md";
                    try {
                      await downloadDesignMdFile(asset(styleDesignMdFile), filename);
                      onNotice(`已触发下载 ${filename}。`);
                    } catch (error) {
                      onNotice(error.message || "下载 DESIGN.md 失败。");
                    }
                  }}>
                  <Download size={14} aria-hidden="true" /><span>下载 DESIGN.md</span>
                </button>
              )}
              {canSave && (
                <button type="button" className="btn" onClick={handleSaveAsStyleCard}>
                  <BookmarkPlus size={15} aria-hidden="true" /><span>存为我的风格卡</span>
                </button>
              )}
              <CopyButton value={combinedBrief} label="一键复制融合 Prompt" onNotice={onNotice} />
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

const mcpClients = [
  { id: "antigravity", label: "Antigravity" },
  { id: "cursor", label: "Cursor" },
  { id: "codex", label: "Codex" },
  { id: "claude", label: "Claude Code" },
  { id: "generic", label: "WorkBuddy / DeepSeek" },
];

const mcpToolSummary = [
  { name: "search_visual_library", desc: "关键词/赛道检索全库 1,216+ 卡片", write: false },
  { name: "get_card_detail", desc: "读取单卡完整 Prompt 与 DESIGN.md 全文", write: false },
  { name: "list_design_systems", desc: "列出全部 85 套本地 DESIGN.md", write: false },
  { name: "get_skill_bundle", desc: "一键拉取 95%+ 还原度风格包与代码原语", write: false },
  { name: "draw_inspiration_brief", desc: "按场景生成 3 卡融合创作指令", write: false },
  { name: "save_visual_card", desc: "新建/更新卡片并同步落地 DESIGN.md", write: true },
  { name: "delete_visual_card", desc: "删除用户卡片或撤销个人修改", write: true },
];

function buildMcpSnippet(client, transport, config) {
  const httpUrl = config?.httpUrl || `${window.location.origin}/mcp`;
  const token = config?.token || "<请先重启本地服务以生成授权密钥>";
  const stdioPath = config?.stdioScriptPath || "/path/to/my-visual-library/server/mcp-server.js";

  if (transport === "http") {
    if (client === "codex") {
      return `# 写入 ~/.codex/config.toml\n[mcp_servers.visual-library]\nurl = "${httpUrl}"\nhttp_headers = { Authorization = "Bearer ${token}" }`;
    }
    if (client === "claude") {
      return `claude mcp add --transport http visual-library "${httpUrl}" \\\n  --header "Authorization: Bearer ${token}"`;
    }
    if (client === "antigravity") {
      return JSON.stringify({
        mcpServers: {
          "visual-library": {
            url: httpUrl,
            headers: { Authorization: `Bearer ${token}` },
          },
        },
      }, null, 2);
    }
    return JSON.stringify({
      mcpServers: {
        "visual-library": {
          url: httpUrl,
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    }, null, 2);
  }

  // Stdio fallback
  if (client === "codex") {
    return `# 写入 ~/.codex/config.toml\n[mcp_servers.visual-library]\ncommand = "node"\nargs = ["${stdioPath}"]`;
  }
  if (client === "claude") {
    return `claude mcp add visual-library -- node "${stdioPath}"`;
  }
  return JSON.stringify({
    mcpServers: {
      "visual-library": {
        command: "node",
        args: [stdioPath],
      },
    },
  }, null, 2);
}

export function PasscodeDialog({ onVerify, onCancel }) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    const code = value.trim();
    if (!code) {
      setError("请输入管理口令。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onVerify(code);
    } catch (err) {
      setError(err?.message || "管理口令不正确，请重新输入。");
      setBusy(false);
    }
  }

  return (
    <Dialog id="passcode-dialog" className="passcode-dialog" title="解锁云端管理权限" onClose={onCancel}
      headerExtra={<span className="mcp-status-pill"><ShieldCheck size={12} aria-hidden="true" />安全校验</span>}>
      <form className="passcode-form" noValidate onSubmit={submit}>
        <p className="passcode-desc">
          当前站点已开启云端写入保护。输入管理口令后，即可在本浏览器解锁<strong>新建/编辑卡片</strong>、<strong>导入备份</strong>与<strong>云端 MCP 密钥管理</strong>。
        </p>
        <div className="passcode-input-wrap">
          <input
            type={show ? "text" : "password"}
            className="field-input passcode-input"
            value={value}
            onChange={(e) => { setValue(e.target.value); if (error) setError(""); }}
            placeholder="请输入管理口令"
            autoComplete="current-password"
            disabled={busy}
            data-dialog-focus
          />
          <button type="button" className="passcode-eye"
            aria-label={show ? "隐藏口令" : "显示口令"}
            onClick={() => setShow((v) => !v)}>
            {show ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
          </button>
        </div>
        {error && <p className="error passcode-error" role="status">{error}</p>}
        <div className="passcode-actions">
          <button type="button" className="btn" disabled={busy} onClick={onCancel}>取消</button>
          <button type="submit" className="btn primary" disabled={busy}>
            <KeyRound size={14} aria-hidden="true" />
            <span>{busy ? "验证中…" : "确认解锁"}</span>
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function McpDialog({ config, error, onUpdate, onRotateToken, onRefresh, onClose, onNotice }) {
  const [transport, setTransport] = useState("http");
  const [client, setClient] = useState("antigravity");
  const [showToken, setShowToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  const snippet = useMemo(() => buildMcpSnippet(client, transport, config), [client, transport, config]);
  const maskedToken = config?.token
    ? `${config.token.slice(0, 10)}${"•".repeat(18)}${config.token.slice(-4)}`
    : "未生成（需重启本地服务）";

  async function handleCopyToken() {
    if (!config?.token) return;
    const ok = await copyText(config.token);
    if (ok) {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 1800);
      onNotice("已复制 Bearer 授权密钥。");
    }
  }

  async function handleCopySnippet() {
    const ok = await copyText(snippet);
    if (ok) {
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 1800);
      onNotice("已复制 MCP 授权接入配置。");
    }
  }

  const lastTimeLabel = config?.lastCallAt
    ? new Date(config.lastCallAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "";

  return (
    <Dialog id="mcp-dialog" className="mcp-dialog" title="MCP 连接与授权中心" onClose={onClose}
      headerExtra={
        <span className={`mcp-status-pill ${config?.enabled ? "is-on" : ""}`}>
          <span className={`mcp-dot ${config?.enabled ? "is-on" : ""}`} aria-hidden="true" />
          {config ? (config.enabled ? "已开启授权" : "已暂停服务") : "等待连接"}
        </span>
      }>
      <div className="mcp-body">
        {error && (
          <div className="mcp-alert" role="status">
            <span>{error}</span>
            <button type="button" className="btn btn-subtle" onClick={onRefresh}>
              <RefreshCw size={13} aria-hidden="true" /><span>重试</span>
            </button>
          </div>
        )}

        <div className="mcp-controls-grid">
          <div className="mcp-switch-card">
            <div className="mcp-switch-info">
              <strong><Plug size={14} aria-hidden="true" />本地 HTTP 授权端点</strong>
              <p>监听 <code>{config?.httpUrl || `${window.location.origin}/mcp`}</code>，仅接受本机带 Bearer 密钥的请求。</p>
            </div>
            <button type="button" role="switch" aria-checked={Boolean(config?.enabled)}
              className={`mcp-switch ${config?.enabled ? "is-on" : ""}`}
              disabled={!config}
              onClick={() => onUpdate({ enabled: !config.enabled })}>
              <span className="mcp-switch-thumb" />
            </button>
          </div>

          <div className="mcp-switch-card">
            <div className="mcp-switch-info">
              <strong><ShieldCheck size={14} aria-hidden="true" />允许 AI 写入新卡片</strong>
              <p>{config?.allowWrite ? "读写模式：AI 可检索、读取 DESIGN.md 并写入蒸馏新卡。" : "只读模式：仅允许检索与读取规范，禁止 AI 修改数据库。"}</p>
            </div>
            <button type="button" role="switch" aria-checked={Boolean(config?.allowWrite)}
              className={`mcp-switch ${config?.allowWrite ? "is-on" : ""}`}
              disabled={!config}
              onClick={() => onUpdate({ allowWrite: !config.allowWrite })}>
              <span className="mcp-switch-thumb" />
            </button>
          </div>
        </div>

        <div className="mcp-section">
          <div className="mcp-section-head">
            <span className="mcp-section-title"><KeyRound size={14} aria-hidden="true" />授权令牌（Bearer Token）</span>
            <span className="mcp-activity">
              {config?.callCount > 0
                ? `已授权调用 ${config.callCount} 次 · 最近：${config.lastTool || "connect"}（${lastTimeLabel}）`
                : "尚未收到外部 AI 调用"}
            </span>
          </div>
          <div className="mcp-token-row">
            <code className="mcp-token-value">{showToken && config?.token ? config.token : maskedToken}</code>
            <div className="mcp-token-actions">
              <button type="button" className="btn btn-subtle" disabled={!config?.token}
                title={showToken ? "隐藏密钥" : "显示完整密钥"}
                onClick={() => setShowToken((v) => !v)}>
                {showToken ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
              </button>
              <button type="button" className="btn btn-subtle" disabled={!config?.token} onClick={handleCopyToken}>
                {copiedToken ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                <span>{copiedToken ? "已复制" : "复制密钥"}</span>
              </button>
              <button type="button" className="btn btn-subtle" disabled={!config} onClick={onRotateToken}
                title="重置后旧密钥立即失效">
                <RotateCcw size={13} aria-hidden="true" /><span>重置密钥</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mcp-section">
          <div className="mcp-section-head">
            <div className="mcp-transport-tabs" role="tablist" aria-label="连接协议">
              <button type="button" role="tab" aria-selected={transport === "http"}
                className={`mcp-tab ${transport === "http" ? "is-active" : ""}`}
                onClick={() => setTransport("http")}>
                {config?.cloudMode ? "云端 HTTPS 授权连接" : "HTTP 授权连接（推荐）"}
              </button>
              {!config?.cloudMode && (
                <button type="button" role="tab" aria-selected={transport === "stdio"}
                  className={`mcp-tab ${transport === "stdio" ? "is-active" : ""}`}
                  onClick={() => setTransport("stdio")}>
                  本地 Stdio（离线可用）
                </button>
              )}
            </div>
            <div className="mcp-client-pills" role="group" aria-label="选择 AI 客户端">
              {mcpClients.map((item) => (
                <button key={item.id} type="button"
                  className={`mcp-client-pill ${client === item.id ? "is-active" : ""}`}
                  onClick={() => setClient(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mcp-code-wrap">
            <pre className="mcp-code-box">{snippet}</pre>
            <button type="button" className="btn primary mcp-copy-cfg" onClick={handleCopySnippet}>
              {copiedConfig ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              <span>{copiedConfig ? "已复制配置" : "一键复制配置"}</span>
            </button>
          </div>
        </div>

        <div className="mcp-section">
          <div className="mcp-section-head">
            <span className="mcp-section-title">已开放能力（7 个 MCP 工具 + 87 份资源）</span>
          </div>
          <div className="mcp-tools-grid">
            {mcpToolSummary.map((tool) => (
              <div key={tool.name} className={`mcp-tool-chip ${tool.write && config && !config.allowWrite ? "is-disabled" : ""}`}>
                <div className="mcp-tool-top">
                  <code>{tool.name}</code>
                  <span className={`mcp-perm-tag ${tool.write ? "is-write" : ""}`}>
                    {tool.write ? (config && !config.allowWrite ? "已禁用写入" : "需写入授权") : "只读"}
                  </span>
                </div>
                <span>{tool.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

export function FeatureDialog({ feature, onClose, onView, onImage }) {
  return (
    <Dialog id="spotlight" title={feature.title} onClose={onClose}>
      <div className="spotlight-body">
        <div className="spotlight-media">
          <AtlasPreview id={feature.id} title={feature.title} onImage={onImage} />
        </div>
        <div>
          <p className="spotlight-category">{feature.category}</p>
          <p>{feature.description}</p>
          <button className="btn primary" type="button" onClick={() => onView(feature)}>
            查看库中卡片 <ArrowDown size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </Dialog>
  );
}

const editorStyleTracks = [
  { id: "ui", label: "网页与产品 UI" },
  { id: "graphic", label: "平面与海报排版" },
  { id: "cinema", label: "摄影与电影镜头" },
  { id: "ai-art", label: "插画与 3D 画风" },
];
const styleTrackLabels = new Set(editorStyleTracks.map((t) => t.label));

function detectCardTrack(card, fallback = "ui") {
  const tags = card?.tags || [];
  const found = editorStyleTracks.find((t) => tags.includes(t.label));
  if (found) return found.id;
  return editorStyleTracks.some((t) => t.id === fallback) ? fallback : "ui";
}

function normalizeUrlInput(raw) {
  const value = (raw || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(value)) return `https://${value}`;
  return value;
}

export function CardEditor({ entry, defaultType, defaultTrack = "ui", onSave, onRemove, onClose }) {
  const card = entry?.card;
  const isBuiltin = Boolean(card?.id && builtinById.has(card.id));
  const isDraft = entry?.edited === false;
  const [type, setType] = useState(card?.type || defaultType);
  const [styleTrack, setStyleTrack] = useState(() => detectCardTrack(card, defaultTrack));
  const [image, setImage] = useState(card?.image || "");
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInput = useRef(null);
  const form = useRef(null);
  const [noteLabel, noteHint, recipeLabel, recipeHint] = hints[type];
  const title = isBuiltin ? (isDraft ? "添加笔记" : "编辑笔记") : (card?.id ? "编辑卡片" : "新建卡片");

  function values() {
    const fields = new FormData(form.current);
    const rawTags = fields.get("tags").split(/[,，、]/).map((tag) => tag.trim()).filter(Boolean);
    const trackLabel = editorStyleTracks.find((t) => t.id === styleTrack)?.label;
    const finalTags = type === "style" && trackLabel
      ? [...new Set([trackLabel, ...rawTags.filter((tag) => !styleTrackLabels.has(tag))])]
      : [...new Set(rawTags)];

    const record = {
      id: card?.id || crypto.randomUUID(),
      type,
      image,
      updated: Date.now(),
      tags: finalTags,
      title: (fields.get("title") || "").trim(),
      source: normalizeUrlInput(fields.get("source")),
      time: (fields.get("time") || "").trim(),
      note: (fields.get("note") || "").trim(),
      recipe: (fields.get("recipe") || "").trim(),
    };
    if (card?.sample) record.sample = true;
    if (card?.art) record.art = card.art;
    return record;
  }

  async function processFile(file) {
    if (!file) return;
    setPending(true);
    setMessage("");
    setCopied(false);
    try { setImage(await imageData(file)); }
    catch (error) { setMessage(error.message || "读取截图失败，请换一张。"); }
    finally { setPending(false); }
  }

  function handlePaste(event) {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type?.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          event.preventDefault();
          void processFile(file);
        }
        return;
      }
    }
  }

  async function save(event) {
    event.preventDefault();
    if (busy || pending) return;
    const record = values();
    if (!record.title) {
      form.current.elements.title.focus();
      return setMessage("请输入标题。");
    }
    if (record.source && !sourceLink(record.source)) {
      form.current.elements.source.focus();
      return setMessage("来源链接格式有误，请输入有效的网址（如 https://example.com）。");
    }
    setBusy(true);
    setCopied(false);
    try {
      await onSave(record);
    } catch (error) {
      setMessage(error.message || "保存失败，请重试。");
      setBusy(false);
    }
  }

  async function remove() {
    if (busy || !confirm(isBuiltin ? "撤销这张词条的个人修改？" : `删除「${card.title}」？`)) return;
    setBusy(true);
    setCopied(false);
    try {
      await onRemove(card);
    } catch (error) {
      setMessage(error.message || "删除失败，请重试。");
      setBusy(false);
    }
  }

  const initialTags = (card?.tags || []).filter((tag) => !(type === "style" && styleTrackLabels.has(tag))).join("，");

  return (
    <Dialog id="editor" title={title} onClose={onClose}>
      <form ref={form} noValidate onSubmit={save} onPaste={handlePaste}>
        <div className="fields">
          <div className="field-group">
            <label htmlFor="editor-type">分类</label>
            <FieldSelect id="editor-type" label="分类" value={type}
              options={Object.entries(names).map(([value, label]) => ({ value, label }))} onChange={setType} />
          </div>
          <label>标题<Input name="title" required maxLength="100" placeholder="给这张灵感卡片起个名字" defaultValue={card?.title} data-dialog-focus /></label>
          <label>来源链接<Input name="source" type="url" maxLength="2000" placeholder="https://（选填，可直接贴域名）" defaultValue={card?.source} /></label>
          <label>时间码<Input name="time" maxLength="30" placeholder="例：01:24–01:28（选填）" defaultValue={card?.time} /></label>
          {type === "style" && (
            <div className="field-group">
              <label htmlFor="editor-track">风格赛道</label>
              <FieldSelect id="editor-track" label="风格赛道" value={styleTrack}
                options={editorStyleTracks.map((t) => ({ value: t.id, label: t.label }))}
                onChange={setStyleTrack} />
            </div>
          )}
          <label className={type === "style" ? "" : "full"}>标签<Input name="tags" maxLength="300" placeholder="用逗号或顿号分隔（选填）" defaultValue={initialTags} /></label>
          <label className="full">{noteLabel}<textarea className="field-input" name="note" rows="3" maxLength="6000" placeholder={noteHint} defaultValue={card?.note} /></label>
          <label className="full">{recipeLabel}<textarea className="field-input" name="recipe" rows="3" maxLength="9000" placeholder={recipeHint} defaultValue={card?.recipe} /></label>
          <div className="field-group full">
            <span>封面截图</span>
            <input ref={fileInput} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              disabled={pending || busy} onChange={(event) => processFile(event.target.files[0])} />
            <div className={`cover-dropzone ${dragging ? "is-dragging" : ""} ${image ? "has-image" : ""}`}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                processFile(event.dataTransfer.files?.[0]);
              }}>
              {image ? (
                <div className="cover-preview-wrap">
                  <img id="image-preview" src={image} alt="封面预览" />
                  <div className="cover-preview-actions">
                    <button className="btn" type="button" disabled={pending || busy}
                      onClick={() => fileInput.current.click()}>更换图片</button>
                    <button className="btn danger" type="button" disabled={pending || busy} onClick={() => {
                      setImage("");
                      fileInput.current.value = "";
                    }}><Trash2 size={14} aria-hidden="true" />移除</button>
                  </div>
                </div>
              ) : (
                <button className="cover-dropzone-trigger" type="button" disabled={pending || busy}
                  onClick={() => fileInput.current.click()}>
                  <span className="cover-dropzone-icon"><ImagePlus size={20} aria-hidden="true" /></span>
                  <strong>点击选择、拖入或按 Cmd+V 粘贴截图</strong>
                  <span className="hint">支持 PNG、JPG、WebP、GIF、AVIF</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <p id="form-message" className="error" data-success={copied ? "" : undefined} role="status">{message}</p>
        <div className="row">
          {card?.id && !isDraft
            ? <button className="btn danger" type="button" disabled={busy || pending} onClick={remove}>
                {isBuiltin ? "撤销我的修改" : "删除卡片"}
              </button>
            : <span />}
          <div className="actions">
            <button className="btn" type="button" onClick={async () => {
              const record = values();
              const text = [record.title, names[type], record.note, record.recipe,
                [record.source, record.time].filter(Boolean).join(" "), record.tags.join("、")].filter(Boolean).join("\n\n");
              const ok = await copyText(text);
              setCopied(ok);
              setMessage(ok ? "已复制。" : "浏览器未允许访问剪贴板。");
            }}>复制卡片内容</button>
            <button className="btn primary" type="submit" disabled={busy || pending}>{pending ? "处理封面中…" : "保存卡片"}</button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
