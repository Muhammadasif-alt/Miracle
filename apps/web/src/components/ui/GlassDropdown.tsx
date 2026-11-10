"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export interface DropdownItem {
  value: string;
  label: string;
  sublabel?: string;
  icon?: string;
}

interface GlassDropdownProps {
  id?: string;
  label?: string;
  placeholder?: string;
  items: (string | DropdownItem)[];
  value: string;
  onChange: (val: string) => void;
  allowCustom?: boolean;
  className?: string;
}

export function GlassDropdown({
  id,
  label,
  placeholder = "Select an option...",
  items,
  value,
  onChange,
  allowCustom = true,
  className = "",
}: GlassDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize items
  const normalizedItems: DropdownItem[] = items.map((it) =>
    typeof it === "string" ? { value: it, label: it } : it
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter items
  const filtered = normalizedItems.filter(
    (item) =>
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.value.toLowerCase().includes(search.toLowerCase())
  );

  const selectedItem = normalizedItems.find((i) => i.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-11 px-3.5 rounded-[14px] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.10)] text-left flex items-center justify-between gap-2 text-xs text-white transition-all shadow-xs"
      >
        <span className="truncate">
          {selectedItem ? (
            <span className="flex items-center gap-2">
              {selectedItem.icon && <span>{selectedItem.icon}</span>}
              <span className="font-medium text-white">{selectedItem.label}</span>
            </span>
          ) : value ? (
            <span className="font-medium text-white">{value}</span>
          ) : (
            <span className="text-[#64748B]">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`size-4 text-[#94A3B8] shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Floating Glass Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 p-2 rounded-[20px] bg-[#0E1017]/95 backdrop-blur-[28px] border border-[rgba(255,255,255,0.12)] shadow-[0_16px_40px_rgba(0,0,0,0.6)] space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
          {/* Search Input */}
          <div className="relative mb-1">
            <Search className="size-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-white placeholder:text-[#64748B] focus:outline-none focus:border-[rgba(255,255,255,0.25)]"
            />
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-none pr-0.5">
            {filtered.length > 0 ? (
              filtered.map((item) => {
                const isSelected = item.value === value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      onChange(item.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full px-3 py-2 rounded-[10px] text-xs text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-[rgba(255,255,255,0.12)] text-white font-semibold"
                        : "text-[#CBD5E1] hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {item.icon && <span>{item.icon}</span>}
                      <span>{item.label}</span>
                      {item.sublabel && (
                        <span className="text-[10px] text-[#64748B]">({item.sublabel})</span>
                      )}
                    </span>
                    {isSelected && <Check className="size-3.5 text-white shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : allowCustom && search.trim() ? (
              <button
                type="button"
                onClick={() => {
                  onChange(search.trim());
                  setIsOpen(false);
                  setSearch("");
                }}
                className="w-full px-3 py-2 rounded-[10px] text-xs text-left text-white bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] font-medium flex items-center gap-1.5"
              >
                <span>Use custom:</span>
                <span className="underline italic truncate font-bold">&quot;{search.trim()}&quot;</span>
              </button>
            ) : (
              <div className="p-3 text-center text-xs text-[#64748B]">No matches found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
