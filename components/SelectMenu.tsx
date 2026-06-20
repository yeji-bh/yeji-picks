"use client";

import { useEffect, useId, useRef, useState } from "react";

export type SelectMenuOption = {
  value: string;
  label: string;
};

export type SelectMenuGroup = {
  label: string;
  options: SelectMenuOption[];
};

type SelectMenuProps = {
  value: string;
  onChange: (value: string) => void;
  options?: SelectMenuOption[];
  groups?: SelectMenuGroup[];
  variant: "icon" | "field";
  align?: "left" | "right";
  ariaLabel: string;
  className?: string;
};

function IconSort({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-8 w-8 shrink-0 ${className}`}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path d="M6 11V5" strokeLinecap="round" />
      <path d="M4.5 6.5 6 5l1.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 5v6" strokeLinecap="round" />
      <path d="M8.5 9.5 10 11l1.5-1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevron({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuOption({
  option,
  selected,
  onSelect,
}: {
  option: SelectMenuOption;
  selected: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onSelect(option.value)}
      className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-subtle"
    >
      <span
        className={
          selected ? "font-medium text-foreground" : "text-foreground-secondary"
        }
      >
        {option.label}
      </span>
      {selected && <IconCheck className="text-foreground" />}
    </button>
  );
}

export default function SelectMenu({
  value,
  onChange,
  options = [],
  groups,
  variant,
  align = "right",
  ariaLabel,
  className = "",
}: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const flatOptions = groups
    ? groups.flatMap((group) => group.options)
    : options;
  const selectedLabel =
    flatOptions.find((option) => option.value === value)?.label ?? "";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSelect(next: string) {
    onChange(next);
    setOpen(false);
  }

  const menuAlignClass =
    align === "right" ? "right-0" : "left-0";
  const caretAlignClass =
    align === "right" ? "right-3" : "left-3";

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={
          variant === "icon"
            ? "flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border border-border bg-input text-foreground-secondary transition-colors hover:bg-subtle"
            : `filter-select box-border flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-sm border border-border bg-input px-3 pr-2 text-left text-sm text-foreground outline-none focus:border-neutral-400 ${className}`
        }
      >
        {variant === "icon" ? (
          <IconSort />
        ) : (
          <>
            <span className="min-w-0 truncate">{selectedLabel}</span>
            <IconChevron className="shrink-0 text-muted" />
          </>
        )}
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className={`ui-dropdown absolute z-40 mt-2 min-w-[13rem] max-w-[min(18rem,calc(100vw-1.5rem))] py-1 ${menuAlignClass}`}
        >
          <div
            className={`absolute -top-1.5 ${caretAlignClass} h-0 w-0 border-x-[6px] border-b-[6px] border-x-transparent border-b-[var(--color-card)]`}
            aria-hidden
          />
          {groups
            ? groups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-muted">
                    {group.label}
                  </p>
                  {group.options.map((option) => (
                    <MenuOption
                      key={option.value}
                      option={option}
                      selected={value === option.value}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              ))
            : options.map((option) => (
                <MenuOption
                  key={option.value}
                  option={option}
                  selected={value === option.value}
                  onSelect={handleSelect}
                />
              ))}
        </div>
      )}
    </div>
  );
}
