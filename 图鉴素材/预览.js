// 本地图鉴里的图片、循环动效与提示词。
"use strict";
const catalogMedia = (() => {
  const atlas = typeof atlasPreviewData === "undefined" ? {} : atlasPreviewData;
  const motion = typeof motionPreviewData === "undefined" ? {} : motionPreviewData;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let playing;

  async function loadPack(name) {
    const pack = window.MotionPrompt?.packs[name];
    if (!pack) throw new Error("预览包未注册");
    await pack.ready;
    return pack;
  }

  function stop() {
    if (!playing) return;
    const current = playing;
    playing = undefined;
    cancelAnimationFrame(current.frame);
    current.button.textContent = "播放";
    current.button.setAttribute("aria-pressed", "false");
    current.button.setAttribute("aria-label", "播放 " + current.title);
  }

  function play(button, title, render, cycle) {
    if (playing?.button === button) {
      stop();
      return;
    }
    stop();
    const current = {button, title, frame:0, start:performance.now()};
    playing = current;
    button.textContent = "暂停";
    button.setAttribute("aria-pressed", "true");
    button.setAttribute("aria-label", "暂停 " + title);
    function frame(now) {
      if (!button.isConnected || button.closest("[hidden]") || document.hidden) {
        stop();
        return;
      }
      try {
        render(((now-current.start)/1000) % cycle);
        current.frame = requestAnimationFrame(frame);
      } catch {
        stop();
      }
    }
    current.frame = requestAnimationFrame(frame);
  }

  function motionPreview(item, title) {
    const [packId, index] = item;
    const figure = element("figure", "entry-media");
    const stage = element("div", "motion-stage");
    const canvas = element("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", title + "的动效示范");
    const button = element("button", "preview-control", "播放");
    button.type = "button";
    button.disabled = true;
    button.setAttribute("aria-label", "播放 " + title);
    button.setAttribute("aria-pressed", "false");
    const error = element("span", "media-message", "正在加载动效…");
    error.setAttribute("role", "status");
    stage.append(canvas, error, button);
    figure.append(stage, element("figcaption", "preview-credit", "Motion Prompt · Shohei Ohtaki · MIT"));

    loadPack(packId).then(pack => {
      if (!figure.isConnected || !pack.cells[index-1]) return;
      const context = canvas.getContext("2d");
      canvas.width = pack.width;
      canvas.height = pack.height;
      function render(time) {
        context.save();
        try {
          context.clearRect(0,0,canvas.width,canvas.height);
          pack.cells[index-1](context,pack.width,pack.height,time);
        } finally {
          context.restore();
        }
      }
      render(pack.cycle * (reduceMotion.matches ? .5 : .4));
      error.hidden = true;
      button.disabled = false;
      button.addEventListener("click", () => play(button,title,render,pack.cycle));
    }).catch(() => {
      error.textContent = "本地动效加载失败";
    });
    return figure;
  }

  function imageSource(id) {
    const file = atlas[id]?.local;
    if (!file) return "";
    return window.visualEmbeddedImages?.["atlas/" + file] || "./图鉴素材/atlas/参考图/" + file;
  }

  function enlarge(src, title, alt) {
    const dialog = document.getElementById("image-dialog");
    const image = document.getElementById("image-dialog-preview");
    document.getElementById("image-dialog-title").textContent = title;
    image.alt = alt;
    image.src = src;
    dialog.showModal();
  }
  const imageDialog = document.getElementById("image-dialog");
  document.getElementById("image-dialog-close").addEventListener("click", () => imageDialog.close());
  imageDialog.addEventListener("close", () => document.getElementById("image-dialog-preview").removeAttribute("src"));

  function imagePreview(id, item, title) {
    const src = imageSource(id);
    if (!src) return null;
    const figure = element("figure","entry-media");
    const stage = element("div","image-stage");
    const image = element("img");
    image.alt = item.title || title + "的视觉参考";
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    const credit = element("figcaption","preview-credit");
    const attribution = element("a","",item.credit);
    attribution.href = item.source;
    attribution.target = "_blank";
    attribution.rel = "noopener noreferrer";
    credit.append(attribution);
    if (item.previewKind) credit.append(document.createTextNode(" · " + item.previewKind));
    if (item.license && item.licenseUrl) {
      const license = element("a","",item.license);
      license.href = item.licenseUrl;
      license.target = "_blank";
      license.rel = "noopener noreferrer";
      credit.append(document.createTextNode(" · "),license);
    }
    image.addEventListener("error", () => {
      stage.replaceChildren(element("span","media-message","未能打开本地预览。请确认项目素材齐全后刷新。"));
    });
    image.src = src;
    const full = element("button","image-link");
    full.type = "button";
    full.setAttribute("aria-label","查看大图 " + title);
    full.addEventListener("click", () => enlarge(src,title,image.alt));
    full.append(image);
    stage.append(full);
    figure.append(stage,credit);
    return figure;
  }

  async function writeClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const earlierFocus = document.activeElement;
      const temp = element("textarea","clipboard-buffer");
      temp.value = text;
      temp.setAttribute("readonly","");
      const dialog = document.querySelector("dialog[open]");
      (dialog || document.body).append(temp);
      temp.select();
      try { return document.execCommand("copy"); }
      catch { return false; }
      finally {
        temp.remove();
        earlierFocus?.focus({preventScroll:true});
      }
    }
  }

  function copyButton(text, label = "复制提示词") {
    const button = element("button","btn prompt-copy",label);
    button.type = "button";
    let timer;
    button.addEventListener("click", async () => {
      const ok = await writeClipboard(text);
      clearTimeout(timer);
      button.textContent = ok ? "已复制" : "复制失败";
      status(ok ? label + "成功。" : "剪贴板不可用，可展开提示词手动复制。");
      timer = setTimeout(() => {button.textContent = label},1800);
    });
    return button;
  }

  function promptTools(text, label) {
    if (!text) return null;
    const tools = element("div","prompt-tools");
    const details = element("details","prompt-text");
    details.append(element("summary","",label),element("p","",text));
    tools.append(copyButton(text),details);
    return tools;
  }

  function preview(source, id, title) {
    if (source === "motion" && motion[id]) return motionPreview(motion[id],title);
    if (source === "atlas" && atlas[id]) return imagePreview(id,atlas[id],title);
    return null;
  }
  function prompt(source,id) {
    return source === "motion" ? motion[id]?.[4] : atlas[id]?.prompt;
  }
  function name(id) {return motion[id]?.[2] || ""}
  function meaning(id) {return motion[id]?.[3] || ""}
  return {preview,prompt,promptTools,copyButton,writeClipboard,name,meaning,imageSource,stop};
})();
