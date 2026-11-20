import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { ArrowUp, CheckCircle2, Monitor, MoonStar, Plug, Sun } from "lucide-react";
import { exportBackup, importBackup, loadLibrary, readCards, readMcpConfig, removeCard, rotateMcpToken, saveCard, setAdminPasscode, updateMcpConfig, verifyAdminPasscode } from "./card-storage.js";
import Hero from "./components/Hero.jsx";
import ScrollRail from "./components/ScrollRail.jsx";
import ChapterShowcase from "./components/ChapterShowcase.jsx";
import Library from "./components/Library.jsx";
import { CardEditor, FeatureDialog, ImageLightbox, InspirationDialog, McpDialog, PasscodeDialog } from "./components/Dialogs.jsx";
import { chapters, useChapterBackdrop, useChapterScroll } from "./chapters.js";

const themeKey = "my-visual-library-theme-mode";
const favKey = "my-visual-library-favorites";
const initialFilters = { type: "all", track: "all", origin: "", tag: "", search: "", fav: false };
const themeOptions = [
  { id: "day", label: "明亮模式", Icon: Sun },
  { id: "system", label: "跟随系统", Icon: Monitor },
  { id: "night", label: "暗夜模式", Icon: MoonStar },
];

function storedThemeMode() {
  try {
    const saved = localStorage.getItem(themeKey);
    return saved === "day" || saved === "night" || saved === "system" ? saved : "system";
  } catch {
    return "system";
  }
}

function prefersSystemDark() {
  try {
    return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  } catch {
    return false;
  }
}

function BrandLogo() {
  return (
    <span className="brand-logo" aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <defs>
          <linearGradient id="vl-card-back" x1="8" y1="4" x2="36" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="55%" stopColor="#FFB156" />
            <stop offset="100%" stopColor="#FF6F7D" />
          </linearGradient>
          <linearGradient id="vl-card-front" x1="4" y1="6" x2="32" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3AA6FF" />
            <stop offset="52%" stopColor="#0071E3" />
            <stop offset="100%" stopColor="#5856D6" />
          </linearGradient>
          <linearGradient id="vl-glass-sheen" x1="6" y1="8" x2="26" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="brand-logo-back">
          <rect x="11" y="6" width="23" height="23" rx="7.5" fill="url(#vl-card-back)" stroke="var(--logo-rim)" strokeWidth="1.6" />
        </g>
        <g className="brand-logo-front">
          <rect x="5" y="9" width="24" height="24" rx="8" fill="url(#vl-card-front)" stroke="var(--logo-rim)" strokeWidth="1.8" />
          <path d="M8.5 11.2H25.5C26.9 11.2 27.6 12.1 27.6 13.5V16.2C22.4 18.8 14.5 19.6 6.8 18.4V13.5C6.8 12.1 7.4 11.2 8.5 11.2Z" fill="url(#vl-glass-sheen)" />
          <path className="brand-logo-spark" d="M17 14.6L18.45 18.55L22.4 20L18.45 21.45L17 25.4L15.55 21.45L11.6 20L15.55 18.55L17 14.6Z" fill="#FFFFFF" />
          <circle cx="22.8" cy="15.2" r="1.5" fill="#FFE082" />
        </g>
      </svg>
    </span>
  );
}

function storedFavorites() {
  try {
    const raw = JSON.parse(localStorage.getItem(favKey) || "[]");
    return new Set(Array.isArray(raw) ? raw.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

function pickRandom(list, excludeId) {
  if (!list.length) return null;
  const filtered = excludeId && list.length > 1 ? list.filter((item) => item.card.id !== excludeId) : list;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function resolveTrack(entry) {
  if (entry.builtin?.track) return entry.builtin.track;
  const tags = entry.card.tags || [];
  if (tags.includes("网页与产品 UI") || tags.includes("DESIGN.md")) return "ui";
  if (tags.includes("摄影与电影镜头") || tags.includes("MOKE")) return "cinema";
  if (tags.includes("插画与 3D 画风")) return "ai-art";
  return "graphic";
}

function drawSlotPool(entries, mode, slotIndex) {
  const refs = entries.filter(({ card, builtin }) => card.type === "reference" && builtin?.origin === "atlas");
  const allMotions = entries.filter(({ builtin }) => builtin?.origin === "motion");
  const allStyles = entries.filter(({ card }) => card.type === "style");

  if (slotIndex === 0) {
    const slotLabel = mode === "ui" ? "01 质感点缀"
      : mode === "cinema" ? "01 光学质感"
      : mode === "graphic" ? "01 印刷与肌理"
      : "01 视觉质感";
    return { slot: slotLabel, list: refs };
  }
  if (slotIndex === 1) {
    if (mode === "ui") {
      const uiMotions = allMotions.filter(({ builtin }) => /^(界面组件|网页效果)/.test(builtin?.group || ""));
      return { slot: "02 交互动效", list: uiMotions.length ? uiMotions : allMotions };
    }
    if (mode === "cinema") {
      const camMotions = allMotions.filter(({ builtin }) => /^(镜头与转场|摄影与布光)/.test(builtin?.group || ""));
      return { slot: "02 运镜与布光", list: camMotions.length ? camMotions : allMotions };
    }
    if (mode === "graphic") {
      const graphicMotions = allMotions.filter(({ builtin }) => /^(图像艺术风格|摄影与布光|动态图形|图表与图解)/.test(builtin?.group || ""));
      return { slot: "02 构图与表现", list: graphicMotions.length ? graphicMotions : allMotions };
    }
    if (mode === "ai-art") {
      const artMotions = allMotions.filter(({ builtin }) => /^(图像艺术风格|摄影与布光)/.test(builtin?.group || ""));
      return { slot: "02 艺术与布光", list: artMotions.length ? artMotions : allMotions };
    }
    return { slot: "02 动效 / 构图", list: allMotions };
  }
  const filteredStyles = mode === "all" ? allStyles : allStyles.filter((e) => resolveTrack(e) === mode);
  const styleLabel = mode === "ui" ? "03 UI 设计系统"
    : mode === "graphic" ? "03 海报风格基底"
    : mode === "cinema" ? "03 电影 / 胶片预设"
    : mode === "ai-art" ? "03 画风与材质基底"
    : "03 风格基底";
  return { slot: styleLabel, list: filteredStyles.length ? filteredStyles : allStyles };
}

function drawInspirationTrio(entries, mode = "all", previous = [], locked = {}) {
  return [0, 1, 2].map((index) => {
    const { slot, list } = drawSlotPool(entries, mode, index);
    if (locked[index] && previous[index]?.entry) {
      return { slot, entry: previous[index].entry };
    }
    const chosen = pickRandom(list, previous[index]?.entry?.card?.id);
    return chosen ? { slot, entry: chosen } : null;
  }).filter(Boolean);
}

export default function App() {
  const [themeMode, setThemeMode] = useState(storedThemeMode);
  const [systemDark, setSystemDark] = useState(prefersSystemDark);
  const night = themeMode === "night" || (themeMode === "system" && systemDark);
  const [favorites, setFavorites] = useState(storedFavorites);
  const [storage, setStorage] = useState("connecting");
  const [authState, setAuthState] = useState({ required: false, unlocked: true });
  const [cards, setCards] = useState([]);
  const [notice, setNotice] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(0);
  const [feature, setFeature] = useState(null);
  const [editor, setEditor] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [inspiration, setInspiration] = useState(null);
  const [inspirationMode, setInspirationMode] = useState("all");
  const [inspirationLocks, setInspirationLocks] = useState({});
  const [mcpOpen, setMcpOpen] = useState(false);
  const [mcpConfig, setMcpConfig] = useState(null);
  const [mcpError, setMcpError] = useState("");
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const passcodeResolver = useRef(null);
  const [playing, setPlaying] = useState(null);
  const [showBackTop, setShowBackTop] = useState(false);
  const inspirationPool = useRef([]);
  const noticeTimer = useRef(null);
  const { active, smoothPosition } = useChapterScroll();
  const backdrop = useChapterBackdrop(smoothPosition);
  const { scrollY, scrollYProgress } = useScroll();
  const scrollRing = useSpring(scrollYProgress, { stiffness: 180, damping: 28, mass: 0.35 });

  useMotionValueEvent(scrollY, "change", (latest) => {
    setShowBackTop(latest > 360);
  });

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const navSection = active === 0 ? "home" : active === chapters.length - 1 ? "library" : "chapters";

  useEffect(() => {
    if (chapters[active].id !== "personal-view") setPlaying(null);
  }, [active]);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = (event) => setSystemDark(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = night ? "night" : "day";
    document.querySelector('meta[name="theme-color"]').content = night ? "#090b10" : "#f9f7f2";
    try { localStorage.setItem(themeKey, themeMode); }
    catch { /* Theme toggling also works without storage. */ }
  }, [night, themeMode]);

  const showNotice = useCallback((message) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 4200);
  }, []);

  const toggleFavorite = useCallback((id) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem(favKey, JSON.stringify([...next])); }
      catch { /* Ignore storage quota errors. */ }
      return next;
    });
  }, []);

  const isConnected = storage === "sqlite" || storage === "postgres" || storage === "migration-warning";

  const ensureUnlocked = useCallback(() => {
    if (!authState.required || authState.unlocked) return Promise.resolve(true);
    return new Promise((resolve) => {
      passcodeResolver.current = resolve;
      setPasscodeOpen(true);
    });
  }, [authState]);

  async function handleVerifyPasscode(code) {
    await verifyAdminPasscode(code);
    setAuthState({ required: true, unlocked: true });
    setPasscodeOpen(false);
    showNotice("管理口令已验证，云端编辑与 MCP 授权已解锁。");
    passcodeResolver.current?.(true);
    passcodeResolver.current = null;
  }

  function handleCancelPasscode() {
    setPasscodeOpen(false);
    passcodeResolver.current?.(false);
    passcodeResolver.current = null;
  }

  const refreshMcp = useCallback(async () => {
    if (authState.required && !authState.unlocked) {
      setMcpConfig(null);
      setMcpError("查看和管理云端 MCP 授权密钥需要先验证管理口令。");
      return;
    }
    try {
      const cfg = await readMcpConfig();
      setMcpConfig(cfg);
      setMcpError("");
    } catch (error) {
      setMcpError(error?.status === 404
        ? "当前运行的服务还是旧版本，重启服务（重新运行「启动视觉库」或 npm start）后即可启用 HTTP 授权端点。"
        : (error.message || "无法读取 MCP 状态。"));
    }
  }, [authState]);

  useEffect(() => {
    if (isConnected && (!authState.required || authState.unlocked)) {
      void refreshMcp();
    }
  }, [isConnected, authState, refreshMcp]);

  async function handleOpenMcp() {
    if (authState.required && !authState.unlocked) {
      const ok = await ensureUnlocked();
      if (!ok) return;
    }
    setMcpOpen(true);
    try {
      const cfg = await readMcpConfig();
      setMcpConfig(cfg);
      setMcpError("");
    } catch (error) {
      setMcpError(error.message || "无法读取 MCP 状态。");
    }
  }

  async function handleUpdateMcp(patch) {
    try {
      const next = await updateMcpConfig(patch);
      setMcpConfig(next);
      setMcpError("");
      showNotice("MCP 授权设置已更新。");
    } catch (error) {
      setMcpError(error.message || "更新 MCP 设置失败。");
    }
  }

  async function handleRotateMcpToken() {
    if (!confirm("重置密钥后，之前已连接的 AI 客户端需要填入新密钥才能继续访问，确定重置？")) return;
    try {
      const next = await rotateMcpToken();
      setMcpConfig(next);
      setMcpError("");
      showNotice("已生成新的 MCP 授权密钥，旧密钥已失效。");
    } catch (error) {
      setMcpError(error.message || "重置密钥失败。");
    }
  }

  // Global "/" shortcut to jump directly to the search input
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (document.querySelector("dialog[open]")) return;
      const searchEl = document.getElementById("search");
      if (!searchEl) return;
      event.preventDefault();
      document.getElementById("personal-view")?.scrollIntoView({ block: "start" });
      searchEl.focus({ preventScroll: true });
      searchEl.select();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    let live = true;
    loadLibrary().then(({ cards: saved, storage: mode, authRequired, unlocked, migrated, migrationWarning }) => {
      if (!live) return;
      setCards(saved);
      setAuthState({ required: Boolean(authRequired), unlocked: unlocked !== false });
      setStorage(migrationWarning ? "migration-warning" : (mode || "sqlite"));
      if (migrated) showNotice(`已从此浏览器迁移 ${migrated} 张卡片到 SQLite。`);
    }).catch(() => {
      if (live) setStorage("offline");
    });
    return () => {
      live = false;
      clearTimeout(noticeTimer.current);
    };
  }, [showNotice]);

  const togglePlayback = useCallback((id) => {
    setPlaying((current) => current === id ? null : id);
  }, []);

  const openImage = useCallback((payload) => {
    setPlaying(null);
    if (!payload) return setLightbox(null);
    if (Array.isArray(payload.items)) setLightbox(payload);
    else setLightbox({ items: [payload], index: 0 });
  }, []);

  function showLibrary() {
    document.getElementById("personal-title").focus({ preventScroll: true });
    document.getElementById("personal-view").scrollIntoView({ block: "start" });
  }

  function changeFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(0);
    setPlaying(null);
  }

  function browseChapter(type, tag = "") {
    setFilters({ ...initialFilters, type, tag });
    setPage(0);
    setPlaying(null);
    history.replaceState(null, "", "#personal-view");
    showLibrary();
  }

  function openFeaturedCard(selected) {
    setFeature(null);
    setFilters({ ...initialFilters, type: "reference", origin: "atlas", search: selected.id });
    setPage(0);
    setPlaying(null);
    requestAnimationFrame(showLibrary);
  }

  function openInspiration(entries) {
    setPlaying(null);
    inspirationPool.current = entries;
    const defaultMode = filters.type === "style" && filters.track && filters.track !== "all" ? filters.track : "ui";
    setInspirationMode(defaultMode);
    setInspirationLocks({});
    setInspiration(drawInspirationTrio(entries, defaultMode));
  }

  function changeInspirationMode(nextMode) {
    setInspirationMode(nextMode);
    setInspirationLocks({});
    setInspiration(drawInspirationTrio(inspirationPool.current, nextMode));
  }

  function shuffleInspiration() {
    setInspiration((current) => drawInspirationTrio(inspirationPool.current, inspirationMode, current || [], inspirationLocks));
  }

  function rerollInspirationSlot(slotIndex) {
    setInspiration((current) => {
      if (!current) return current;
      const { slot, list } = drawSlotPool(inspirationPool.current, inspirationMode, slotIndex);
      const next = pickRandom(list, current[slotIndex]?.entry?.card?.id);
      if (!next) return current;
      return current.map((item, idx) => (idx === slotIndex ? { slot, entry: next } : item));
    });
  }

  function toggleInspirationLock(slotIndex) {
    setInspirationLocks((curr) => ({ ...curr, [slotIndex]: !curr[slotIndex] }));
  }

  function saveInspirationDraft(draft) {
    setInspiration(null);
    setEditor({ entry: { card: draft, edited: false } });
  }

  function jumpToCard(card) {
    setInspiration(null);
    setFilters({ ...initialFilters, type: card.type, search: card.title.split(" · ")[0] });
    setPage(0);
    setPlaying(null);
    requestAnimationFrame(showLibrary);
  }

  async function persistCard(card) {
    const isNewCard = !editor.entry?.card?.id;
    const original = editor.entry?.edited === false ? null : editor.entry?.card;
    let saved;
    try {
      saved = await saveCard(card, original ? (original.updated ?? 0) : null);
    } catch (error) {
      if (error.status === 409) setCards(await readCards().catch(() => cards));
      throw error;
    }
    setCards((current) => [...current.filter((item) => item.id !== saved.id), saved]);
    if (isNewCard) {
      setFilters((current) => ({
        ...current,
        type: current.type === "all" || current.type === saved.type ? current.type : saved.type,
        track: saved.type === "style" ? (
          saved.tags.includes("网页与产品 UI") ? "ui"
          : saved.tags.includes("摄影与电影镜头") ? "cinema"
          : saved.tags.includes("插画与 3D 画风") ? "ai-art"
          : current.track === "all" ? "all" : "graphic"
        ) : "all",
        origin: current.origin && current.origin !== "own" ? "" : current.origin,
        tag: "",
        search: "",
        fav: false,
      }));
      setPage(0);
    } else if (filters.type !== "all" && filters.type !== card.type) {
      changeFilter("type", "all");
    }
    setEditor(null);
    showNotice("卡片已保存。");
  }

  async function deleteCard(card) {
    try {
      await removeCard(card.id, card.updated ?? 0);
    } catch (error) {
      if (error.status === 409) setCards(await readCards().catch(() => cards));
      throw error;
    }
    setCards((current) => current.filter((item) => item.id !== card.id));
    setEditor(null);
    showNotice("卡片修改已移除。");
  }

  async function loadBackup(file) {
    try {
      const { count, preserved } = await importBackup(file);
      setCards(await readCards());
      showNotice(`导入完成，新增或更新 ${count} 张卡片。${preserved ? `保留 ${preserved} 条相同或较新的本地记录。` : ""}`);
    } catch (error) {
      showNotice("导入失败。 " + (error.message || "请检查备份后重试。"));
    }
  }

  const navPillTransition = { type: "spring", stiffness: 420, damping: 34 };

  return (
    <MotionConfig reducedMotion="user">
      <motion.header className="top" style={{ "--top-scene": backdrop }}>
        <div className="wrap">
          <a className="brand" href="#home">
            <BrandLogo />
            <span className="brand-name">我的视觉库</span>
          </a>
          <nav className="top-nav" aria-label="页面导航">
            <a href="#home" aria-current={navSection === "home" ? "location" : undefined}>
              {navSection === "home" && <motion.span className="top-nav-pill" layoutId="top-nav-pill" transition={navPillTransition} />}
              <span>首页</span>
            </a>
            <a href="#chapter-reference" aria-current={navSection === "chapters" ? "location" : undefined}>
              {navSection === "chapters" && <motion.span className="top-nav-pill" layoutId="top-nav-pill" transition={navPillTransition} />}
              <span>章节导览</span>
            </a>
            <button type="button" onClick={showLibrary} aria-controls="personal-view"
              aria-current={navSection === "library" ? "location" : undefined}>
              {navSection === "library" && <motion.span className="top-nav-pill" layoutId="top-nav-pill" transition={navPillTransition} />}
              <span>我的卡片</span>
            </button>
          </nav>
          <div className="top-actions">
            <button type="button" className={`top-mcp-btn ${mcpConfig?.enabled ? "is-on" : ""}`}
              onClick={handleOpenMcp}
              title="MCP 连接与授权中心"
              aria-label="MCP 连接与授权中心">
              <span className={`mcp-dot ${mcpConfig?.enabled ? "is-on" : ""}`} aria-hidden="true" />
              <Plug size={13} aria-hidden="true" />
              <span>MCP</span>
            </button>
            <div className="theme-switcher" role="radiogroup" aria-label="外观模式">
              {themeOptions.map(({ id, label, Icon }) => {
                const selected = themeMode === id;
                return (
                  <button key={id} type="button" role="radio" aria-checked={selected}
                    className={`theme-opt ${selected ? "is-active" : ""}`}
                    aria-label={label} title={label}
                    onClick={() => setThemeMode(id)}>
                    {selected && (
                      <motion.span className="theme-opt-pill" layoutId="theme-mode-pill" transition={navPillTransition} />
                    )}
                    <Icon size={14} aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.header>
      <ScrollRail active={active} position={smoothPosition} />
      <motion.main className="library-page" style={{ backgroundColor: backdrop }}>
        <Hero position={smoothPosition} onOpen={(selected) => { setPlaying(null); setFeature(selected); }} onBrowse={showLibrary} />
        <ChapterShowcase active={active} position={smoothPosition} onBrowse={browseChapter} onImage={openImage} />
        <Library cards={cards} filters={filters} setFilter={changeFilter} page={page}
          setPage={(next) => { setPlaying(null); setPage(next); }} storage={storage}
          favorites={favorites} onToggleFavorite={toggleFavorite}
          onEdit={async (entry) => {
            if (!(await ensureUnlocked())) return;
            setPlaying(null);
            setEditor({ entry });
          }}
          onNew={async () => {
            if (!(await ensureUnlocked())) return;
            setPlaying(null);
            setEditor({});
          }}
          onInspiration={openInspiration}
          onBrowse={showLibrary}
          onImport={async (file) => {
            if (!(await ensureUnlocked())) return;
            await loadBackup(file);
          }} onExport={async () => {
            try {
              const latest = await readCards();
              setCards(latest);
              exportBackup(latest);
              showNotice(`已导出 ${latest.length} 张卡片。`);
            } catch (error) {
              showNotice(error.message);
            }
          }}
          onNotice={showNotice} onImage={openImage}
          playing={playing} onPlay={togglePlayback} />
      </motion.main>
      {feature && <FeatureDialog feature={feature} onClose={() => setFeature(null)} onView={openFeaturedCard} onImage={openImage} />}
      {passcodeOpen && <PasscodeDialog onVerify={handleVerifyPasscode} onCancel={handleCancelPasscode} />}
      {mcpOpen && <McpDialog config={mcpConfig} error={mcpError}
        onUpdate={handleUpdateMcp} onRotateToken={handleRotateMcpToken}
        onRefresh={refreshMcp} onClose={() => setMcpOpen(false)} onNotice={showNotice} />}
      {editor && <CardEditor entry={editor.entry}
        defaultType={filters.type === "all" ? "reference" : filters.type}
        defaultTrack={filters.track && filters.track !== "all" ? filters.track : "ui"}
        onClose={() => setEditor(null)} onSave={persistCard} onRemove={deleteCard} />}
      {lightbox && <ImageLightbox state={lightbox} onClose={() => setLightbox(null)}
        onNavigate={(nextIndex) => setLightbox((curr) => curr ? { ...curr, index: nextIndex } : null)}
        onNotice={showNotice} isFavorite={(id) => favorites.has(id)} onToggleFavorite={toggleFavorite} />}
      {inspiration && <InspirationDialog trio={inspiration}
        mode={inspirationMode} locks={inspirationLocks}
        onModeChange={changeInspirationMode}
        onToggleLock={toggleInspirationLock}
        onRerollSlot={rerollInspirationSlot}
        onShuffle={shuffleInspiration}
        onSaveDraft={saveInspirationDraft}
        canSave={isConnected}
        onClose={() => setInspiration(null)} onJump={jumpToCard} onNotice={showNotice}
        isFavorite={(id) => favorites.has(id)} onToggleFavorite={toggleFavorite} />}
      <AnimatePresence>
        {showBackTop && (
          <motion.button
            type="button"
            className="back-to-top"
            aria-label="回到顶部"
            title="回到顶部"
            onClick={scrollToTop}
            initial={{ opacity: 0, y: 18, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.85 }}
            whileHover={{ y: -3, scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
          >
            <svg className="back-to-top-ring" viewBox="0 0 48 48" aria-hidden="true">
              <circle className="back-to-top-track" cx="24" cy="24" r="21" />
              <motion.circle className="back-to-top-progress" cx="24" cy="24" r="21" style={{ pathLength: scrollRing }} />
            </svg>
            <ArrowUp size={17} aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
      <div className="notice-dock" aria-live="polite">
        <AnimatePresence>
          {notice && (
            <motion.div id="notice" role="status"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}>
              <CheckCircle2 size={15} aria-hidden="true" />
              <span>{notice}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
