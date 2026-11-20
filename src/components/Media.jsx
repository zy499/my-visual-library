import { useEffect, useRef, useState } from "react";
import { Check, Copy, Maximize2, Pause, Play } from "lucide-react";
import { asset, atlas, motion } from "../library-data.js";
import { copyText } from "../card-storage.js";

const packs = new Map();
let runtime;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => {
      script.remove();
      reject(new Error("无法加载本地动效"));
    };
    document.head.append(script);
  });
}

function loadPack(name) {
  runtime ??= loadScript(asset("motion/runtime.js")).catch((error) => {
    runtime = null;
    throw error;
  });
  if (!packs.has(name)) {
    packs.set(name, runtime.then(async () => {
      await loadScript(asset(`motion/packs/${name}/pack.js`));
      const pack = window.MotionPrompt.packs[name];
      await pack.ready;
      return pack;
    }).catch((error) => {
      packs.delete(name);
      throw error;
    }));
  }
  return packs.get(name);
}

function MotionPreview({ item, title, playing, onPlay, onImage }) {
  const [packName, index] = item;
  const canvas = useRef(null);
  const draw = useRef(null);
  const [state, setState] = useState("loading");
  useEffect(() => {
    let live = true;
    loadPack(packName).then((pack) => {
      if (!live) return;
      const context = canvas.current.getContext("2d");
      canvas.current.width = pack.width;
      canvas.current.height = pack.height;
      draw.current = (time) => {
        context.save();
        try {
          context.clearRect(0, 0, pack.width, pack.height);
          pack.cells[index - 1](context, pack.width, pack.height, time % pack.cycle);
        } finally {
          context.restore();
        }
      };
      draw.current(pack.cycle * 0.45);
      setState("ready");
    }).catch(() => { if (live) setState("error"); });
    return () => { live = false; };
  }, [packName, index]);

  useEffect(() => {
    if (!playing || state !== "ready") return;
    let frame;
    const start = performance.now();
    function animate(now) {
      if (document.hidden) {
        onPlay();
        return;
      }
      draw.current((now - start) / 1000);
      frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [playing, state, onPlay]);

  return (
    <figure className="entry-media">
      <div className={`motion-stage ${onImage ? "is-clickable" : ""}`}
        onClick={onImage ? () => onImage() : undefined}>
        <canvas ref={canvas} role="img" aria-label={title + "的动效示范"} />
        {onImage && (
          <button type="button" className="motion-zoom-btn" aria-label={"放大查看 " + title}
            title="放大查看" onClick={(event) => { event.stopPropagation(); onImage(); }}>
            <Maximize2 size={13} aria-hidden="true" />
          </button>
        )}
        {state === "ready"
          ? <button className="preview-control" type="button" aria-pressed={playing}
              aria-label={`${playing ? "暂停" : "播放"} ${title}`}
              onClick={(event) => { event.stopPropagation(); onPlay(); }}>
              {playing ? <Pause size={12} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
              <span>{playing ? "暂停" : "播放"}</span>
            </button>
          : <span className="media-message">{state === "error" ? "本地动效加载失败" : "正在加载动效…"}</span>}
      </div>
    </figure>
  );
}

function AtlasCredit({ item }) {
  return (
    <>
      <a href={item.source} target="_blank" rel="noreferrer">{item.credit}</a>
      {item.license && <> · <a href={item.licenseUrl} target="_blank" rel="noreferrer">{item.license}</a></>}
    </>
  );
}

export function CatalogCredit({ entry }) {
  if (entry.origin === "motion") return "Motion Prompt · Shohei Ohtaki · MIT";
  const item = atlas[entry.key];
  return item?.local ? <AtlasCredit item={item} /> : null;
}

export function AtlasPreview({ id, title, onImage, showCredit = true }) {
  const item = atlas[id];
  const [failed, setFailed] = useState(false);
  if (!item?.local) return null;
  const src = asset(`atlas/参考图/${item.local}`);
  const alt = item.title || title + "的视觉参考";
  return (
    <figure className="entry-media">
      <div className="image-stage">
        {failed ? <span className="media-message">参考图加载失败，可打开原站查看。</span>
          : <button type="button" className="image-link" aria-label={"查看大图 " + title}
              onClick={() => onImage({
                title,
                src,
                alt,
                prompt: item.prompt,
                source: item.source,
                credit: item.credit,
              })}>
              <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
              <span className="image-zoom-hint" aria-hidden="true">
                <Maximize2 size={13} />
              </span>
            </button>}
      </div>
      {showCredit && <figcaption className="preview-credit"><AtlasCredit item={item} /></figcaption>}
    </figure>
  );
}

export function CatalogMedia({ entry, title, playing, onPlay, onImage }) {
  if (entry.origin === "atlas") {
    return <AtlasPreview id={entry.key} title={title} onImage={onImage} showCredit={false} />;
  }
  const item = motion[entry.key];
  return item ? <MotionPreview item={item} title={title} playing={playing} onPlay={onPlay} onImage={onImage} /> : null;
}

export function CopyButton({ value, label = "复制提示词", shortLabel, iconOnly = false, onNotice }) {
  const [done, setDone] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button className={iconOnly ? "card-tool card-tool-icon" : shortLabel ? "card-tool" : "btn"}
      type="button" aria-label={label} title={label}
      onClick={async () => {
        const copied = await copyText(value);
        if (copied) {
          setDone(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setDone(false), 1800);
        }
        onNotice(copied ? "已复制到剪贴板。" : "浏览器未允许访问剪贴板。");
      }}>
      {done ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      {!iconOnly && <span>{done && !shortLabel ? "已复制" : (shortLabel || label)}</span>}
    </button>
  );
}
