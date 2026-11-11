"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, MapPin } from "lucide-react";

export type Place = { name: string; detail: string; lat: number; lon: number };

const api = (qs: URLSearchParams, signal?: AbortSignal) => fetch(`/api/lead-finder/places?${qs}`, { signal }).then((r) => r.json());

/**
 * Text box with a suggestion list.
 *  - city: every city of the chosen country appears as soon as the box is opened; typing filters it.
 *          (If the city list can't be loaded, live search is used instead.)
 *  - area: live suggestions of neighbourhoods around the chosen city.
 */
export function PlaceInput({
  type,
  country,
  countryName,
  near,
  value,
  placeholder,
  label,
  onChange,
  onPick,
}: {
  type: "city" | "area";
  country: string;
  countryName?: string;
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
  const [allCities, setAllCities] = useState<string[] | null>(null);
  const typed = useRef(false);

  // city mode: load the country's full city list once per country
  useEffect(() => {
    if (type !== "city" || !countryName) return;
    setAllCities(null);
    const ctl = new AbortController();
    setLoading(true);
    api(new URLSearchParams({ type: "cities", countryName }), ctl.signal)
      .then((d) => setAllCities(Array.isArray(d.cities) ? d.cities : []))
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [type, countryName]);

  // city mode with a list: filter locally (starts-with first)
  useEffect(() => {
    if (type !== "city" || !allCities?.length) return;
    const q = value.trim().toLowerCase();
    const starts = allCities.filter((c) => c.toLowerCase().startsWith(q));
    const contains = q ? allCities.filter((c) => !c.toLowerCase().startsWith(q) && c.toLowerCase().includes(q)) : [];
    setItems([...starts, ...contains].slice(0, 60).map((name) => ({ name, detail: "", lat: NaN, lon: NaN })));
    setActive(0);
  }, [type, allCities, value]);

  // live search (areas, or cities when the list isn't available)
  useEffect(() => {
    if (type === "city" && allCities?.length) return;
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
        const d = await api(qs, ctl.signal);
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
  }, [value, type, country, near, allCities]);

  const pick = async (p: Place) => {
    typed.current = false;
    setOpen(false);
    if (Number.isFinite(p.lat)) return onPick(p);
    // a city from the list: look up its coordinates so the area suggestions and the search are exact
    onPick(p);
    try {
      const d = await api(new URLSearchParams({ type: "city", q: p.name, country }));
      const exact = (d.places as Place[] | undefined)?.find((x) => x.name.toLowerCase() === p.name.toLowerCase()) ?? d.places?.[0];
      if (exact) onPick({ ...exact, name: p.name });
    } catch {
      /* the search falls back to geocoding the name */
    }
  };

  const listMode = type === "city" && !!allCities?.length;

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
          if (listMode) setOpen(true);
        }}
        onFocus={(e) => {
          if (listMode) e.target.select();
          if (items.length || listMode) setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open || !items.length) return;
          if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(items.length - 1, a + 1)));
          else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(0, a - 1)));
          else if (e.key === "Enter") (e.preventDefault(), void pick(items[active]!));
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      {loading ? (
        <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-faint" />
      ) : listMode ? (
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
      ) : null}
      {open && items.length ? (
        <ul role="listbox" className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-2xl border border-line bg-(--color-canvas) p-1 shadow-xl">
          {items.map((p, i) => (
            <li
              key={`${p.name}-${p.lat}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => (e.preventDefault(), void pick(p))}
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
