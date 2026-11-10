"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

export interface OptionItem {
  value: string;
  label: string;
  sublabel?: string;
  icon?: string;
}

interface SearchableSelectProps {
  label: string;
  value: string;
  options: (OptionItem | string)[];
  onChange: (value: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
  customPlaceholder?: string;
  className?: string;
}

export function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select option...",
  allowCustom = false,
  customPlaceholder = "Type custom value...",
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize options
  const normalizedOptions: OptionItem[] = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return opt;
  });

  // Filter options based on search term
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.sublabel && opt.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const selectedItem = normalizedOptions.find((o) => o.value === value);
  const displayLabel = selectedItem ? selectedItem.label : value || placeholder;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label className="text-[11px] font-semibold text-[#888888] block mb-1">
        {label}
      </label>

      {isCustomMode ? (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (customValue.trim()) {
                  onChange(customValue.trim());
                  setIsCustomMode(false);
                }
              }
            }}
            placeholder={customPlaceholder}
            className="input bg-[#181818] border-[#262626] text-xs text-white h-9 flex-1"
            autoFocus
          />
          <button
            type="button"
            onClick={() => {
              if (customValue.trim()) {
                onChange(customValue.trim());
              }
              setIsCustomMode(false);
            }}
            className="rounded-[6px] bg-[#10B981] px-2.5 h-9 text-xs font-semibold text-white hover:bg-[#059669] transition"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsCustomMode(false)}
            className="rounded-[6px] border border-[#2A2A2A] bg-[#1C1C1C] px-2 h-9 text-xs text-[#888888] hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 h-9 px-3 rounded-[6px] bg-[#181818] border border-[#262626] hover:border-[#333333] text-left text-xs text-white transition focus:outline-none focus:border-[#10B981]"
        >
          <span className="truncate flex items-center gap-1.5">
            {selectedItem?.icon && <span>{selectedItem.icon}</span>}
            <span className={value ? "text-white font-medium" : "text-[#777777]"}>
              {displayLabel}
            </span>
          </span>
          <ChevronDown className={`size-3.5 text-[#666666] shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[200px] z-50 rounded-lg border border-[#2A2A2A] bg-[#161616] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-[#222222]">
            <div className="relative">
              <Search className="size-3.5 absolute left-2.5 top-2.5 text-[#666666]" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full bg-[#1F1F1F] border border-[#2B2B2B] pl-8 pr-2 py-1 text-xs text-white rounded-[4px] focus:outline-none focus:border-[#10B981]"
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-[#777777]">
                No matches found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[4px] text-xs text-left transition ${
                      isSelected
                        ? "bg-[#10B981]/15 text-[#10B981] font-semibold"
                        : "text-[#CCCCCC] hover:bg-[#202020] hover:text-white"
                    }`}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      {opt.icon && <span>{opt.icon}</span>}
                      <span>{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-[#666666]">({opt.sublabel})</span>
                      )}
                    </span>
                    {isSelected && <Check className="size-3.5 text-[#10B981] shrink-0" />}
                  </button>
                );
              })
            )}

            {allowCustom && (
              <div className="pt-1 mt-1 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setCustomValue("");
                    setIsCustomMode(true);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs text-[#10B981] hover:bg-[#10B981]/10 rounded-[4px] text-left font-medium flex items-center gap-1.5"
                >
                  <span>+ Custom entry...</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
