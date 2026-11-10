"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

export type Place = { name: string; detail: string; lat: number; lon: number };

/** Text box with live place suggestions (cities of a country, or areas around a city). */
export function PlaceInput({
  type,
  country,
  near,
  value,
  placeholder,
  label,
  onChange,
  onPick,
}: {
  type: "city" | "area";
  country: string;
  near?: Place | null;
  value: string;
  placeholder: string;
  label: string;
  onChange: (v: string) => void;
  onPick: (p: Place) => void;
}) {
  const [items, setItems] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const typed = useRef(false);

  useEffect(() => {
    if (!typed.current || value.trim().length < 2) {
      setItems([]);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      const qs = new URLSearchParams({ type, q: value, country });
      if (near) {
        qs.set("lat", String(near.lat));
        qs.set("lon", String(near.lon));
      }
      try {
        const d = await fetch(`/api/lead-finder/places?${qs}`, { signal: ctl.signal }).then((r) => r.json());
        setItems(d.places ?? []);
        setActive(0);
        setOpen(true);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [value, type, country, near]);

  const pick = (p: Place) => {
    typed.current = false;
    onPick(p);
    setOpen(false);
  };

  return (
    <div className="relative">
      <MapPin className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
      <input
        className="input h-11 pr-8 pl-9"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && items.length > 0}
        onChange={(e) => {
          typed.current = true;
          onChange(e.target.value);
        }}
        onFocus={() => items.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !items.length) return;
          if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(items.length - 1, a + 1)));
          else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(0, a - 1)));
          else if (e.key === "Enter") (e.preventDefault(), pick(items[active]!));
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      {loading ? <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-faint" /> : null}
      {open && items.length ? (
        <ul role="listbox" className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-line bg-(--color-canvas) p-1 shadow-xl">
          {items.map((p, i) => (
            <li
              key={`${p.name}-${p.lat}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => (e.preventDefault(), pick(p))}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer rounded-xl px-3 py-2 text-sm ${i === active ? "bg-(--accent)/15" : ""}`}
            >
              {p.name}
              {p.detail ? <span className="ml-1.5 text-xs text-faint">{p.detail}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
