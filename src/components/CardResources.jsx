import * as Popover from "@radix-ui/react-popover";
import { BookOpen, X } from "lucide-react";
import { useState } from "react";
import { CatalogCredit, CopyButton } from "./Media.jsx";

export default function CardResources({ entry, title, hasCredit }) {
  const [notice, setNotice] = useState("");
  return (
    <Popover.Root onOpenChange={() => setNotice("")}>
      <Popover.Trigger className="card-tool card-tool-icon" aria-label={"查看资料 " + title} title="查看提示词与资料">
        <BookOpen size={14} aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="card-resources" align="end" sideOffset={10} collisionPadding={12} aria-label={title}>
          <div className="card-resources-head">
            <h3>{title}</h3>
            <Popover.Close className="dialog-close" aria-label="关闭资料">
              <X size={15} aria-hidden="true" />
            </Popover.Close>
          </div>
          {entry.card?.type === "style" && entry.card?.recipe && <section aria-label="风格规则" style={{ marginBottom: 14 }}>
            <h4>完整风格配方</h4>
            <p className="card-prompt">{entry.card.recipe}</p>
            <CopyButton value={[entry.card.title, entry.card.note, entry.card.recipe].filter(Boolean).join("\n\n")}
              label="复制完整配方" onNotice={setNotice} />
          </section>}
          {entry.prompt && <section aria-label="提示词">
            <h4>{entry.origin === "atlas" ? "官方英文提示词" : entry.origin === "motion" ? "官方 Motion Prompt（含规范与参考实现）" : entry.card?.type === "style" ? "AI 风格提示词 / Prompt" : "示例提示词"}</h4>
            <p className="card-prompt">{entry.prompt}</p>
            <CopyButton value={entry.prompt} onNotice={setNotice} />
          </section>}
          {hasCredit && <p className="card-credit"><CatalogCredit entry={entry} /></p>}
          {notice && <p role="status" className="card-copy-notice">{notice}</p>}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
