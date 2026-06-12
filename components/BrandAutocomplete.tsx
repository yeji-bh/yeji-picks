"use client";

import { useEffect, useId, useRef, useState } from "react";

export default function BrandAutocomplete({
  value,
  onChange,
  placeholder,
  className = "ui-field mt-1 px-3 py-2 text-sm",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const listId = useId();
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/brands/search?q=${encodeURIComponent(query.trim())}`
        );
        const data = await res.json();
        setSuggestions(Array.isArray(data.brands) ? data.brands : []);
      } catch {
        setSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  function pick(brand: string) {
    setQuery(brand);
    onChange(brand);
    setOpen(false);
  }

  function handleBlur() {
    blurTimer.current = setTimeout(() => setOpen(false), 120);
  }

  function handleFocus() {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setOpen(true);
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
        list={listId}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="ui-dropdown absolute z-20 mt-1 max-h-48 w-full overflow-auto py-1">
          {suggestions.map((brand) => (
            <li key={brand}>
              <button
                type="button"
                className="w-full cursor-pointer px-3 py-2 text-left text-sm text-foreground hover:bg-subtle"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(brand)}
              >
                {brand}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
