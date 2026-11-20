import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useRef, useState } from "react";

export function Input({ className = "", ...props }) {
  return <input className={`field-input ${className}`} data-slot="input" {...props} />;
}

export function SearchField({ value, onChange }) {
  const input = useRef(null);
  return (
    <div className="field-search" data-slot="input-group">
      <Search size={17} aria-hidden="true" />
      <Input ref={input} id="search" type="search" placeholder="搜索中英文、笔记或标签" aria-label="搜索卡片"
        value={value} onChange={(event) => onChange(event.target.value)} />
      {value
        ? <button className="field-clear" type="button" aria-label="清空搜索" onClick={() => {
            onChange("");
            input.current.focus();
          }}><X size={15} aria-hidden="true" /></button>
        : <kbd className="field-kbd" aria-hidden="true">/</kbd>}
    </div>
  );
}

export function FieldSelect({ id, label, value, options, onChange, icon: Icon }) {
  const trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((item) => item.value === value) || options[0];

  return (
    <Popover.Root modal={false} open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button ref={trigger} id={id} type="button" className="field-select"
          aria-label={label} aria-haspopup="listbox" aria-expanded={open}>
          {Icon && <Icon size={16} aria-hidden="true" />}
          <span className="field-select-value">{selectedOption?.label ?? ""}</span>
          <span className="field-select-chevron" aria-hidden="true"><ChevronDown size={16} /></span>
        </button>
      </Popover.Trigger>
      <Popover.Portal container={trigger.current?.closest("dialog") ?? undefined}>
        <Popover.Content className="field-options" align="start" sideOffset={7} collisionPadding={12}
          onOpenAutoFocus={(event) => event.preventDefault()}>
          <div className="field-options-list" role="listbox" aria-label={label}>
            {options.map((option) => {
              const checked = option.value === value;
              return (
                <button key={option.value} type="button" role="option" aria-selected={checked}
                  className="field-option" data-state={checked ? "checked" : "unchecked"}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                    trigger.current?.focus();
                  }}>
                  <span>{option.label}</span>
                  {checked && <span className="field-option-check" aria-hidden="true"><Check size={14} /></span>}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
