// Theme codemod for apps/web/src: neutral hex classes -> CSS vars (dark + light values), green -> hero violet/cyan.
// Usage: node theme-codemod.cjs <path-to-apps/web/src>
const fs = require("fs");
const path = require("path");

const SRC = process.argv[2];
const LANDING = path.join(SRC, "components", "landing");
const PREFIX = "(bg|border|border-[trblxy]|text|from|via|to|ring|outline|divide|fill|stroke|shadow|decoration|placeholder|caret|accent)";
const CLASS_RE = new RegExp(`(?<![\\w-])${PREFIX}-\\[#([0-9A-Fa-f]{6})\\]`, "g");

const GREEN = { "10B981": "accent", "059669": "accent-strong", "34D399": "accent-text" };
const ACCENT_TEXT = new Set(["C7BFFF", "A99DFF"]);

const rgb = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (r, g, b) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const isNeutral = (h) => {
  const [r, g, b] = rgb(h);
  return Math.max(r, g, b) - Math.min(r, g, b) <= 28;
};
const lum = (h) => {
  const [r, g, b] = rgb(h);
  return (r + g + b) / 3;
};
/** Light-mode counterpart: dark surfaces -> light surfaces (keeping elevation), greys -> darker greys. */
function lightOf(h, kind) {
  const L = lum(h);
  if (kind === "text" || L >= 100) {
    const v = (255 - L) * 0.85;
    return hex(v - 2, v - 2, v + 8);
  }
  let v;
  if (L <= 10) v = 244; // canvas
  else if (L <= 34) v = 255 - (L - 10) * 0.45; // cards / raised surfaces
  else v = 236 - (L - 34) * 0.75; // borders, strong borders, chips
  return hex(v - 4, v - 3, v + 2);
}

// 1) collect files
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(e.name)) files.push(p);
  }
})(SRC);

const used = new Map(); // HEX -> kind ("text" | "surface")
let classHits = 0;
let fileChanges = 0;
for (const f of files) {
  const landing = f.startsWith(LANDING);
  let s = fs.readFileSync(f, "utf8");
  const o = s;
  if (landing) {
    // landing stays dark: only swap green for hero cyan literals
    s = s.replace(/emerald-(400|500)/g, "[#6ad8ff]").replace(/emerald-(200|300)/g, "[#a8e8ff]");
  } else {
    s = s.replace(CLASS_RE, (m, p, h) => {
      const H = h.toUpperCase();
      if (GREEN[H]) {
        classHits++;
        return `${p}-(--${GREEN[H]})`;
      }
      if (ACCENT_TEXT.has(H)) {
        classHits++;
        return `${p}-(--accent-text)`;
      }
      if (!isNeutral(H)) return m; // semantic colours (red, amber, sky…) stay as they are
      const kind = p === "text" || p === "placeholder" || p === "caret" || p === "decoration" ? "text" : "surface";
      if (!used.has(H)) used.set(H, new Set());
      used.get(H).add(kind);
      classHits++;
      return `${p}-(--n-${H.toLowerCase()})`;
    });
    s = s.replace(/emerald-(400|500)/g, "(--good)").replace(/emerald-(200|300)/g, "(--good-text)");
    s = s.replace(/"#10B981"/gi, '"#8b7bff"').replace(/"#059669"/gi, '"#6d5dfc"');
  }
  if (s !== o) {
    fs.writeFileSync(f, s);
    fileChanges++;
  }
}

// 2) globals.css: green -> violet everywhere; neutral hex -> vars only in the app/component part (not @theme, not landing fx)
const cssPath = path.join(SRC, "app", "globals.css");
let css = fs.readFileSync(cssPath, "utf8");
css = css.replace(/rgba\(16,\s*185,\s*129/g, "rgba(139, 123, 255").replace(/#10B981/gi, "var(--accent)").replace(/#059669/gi, "var(--accent-strong)").replace(/#34D399/gi, "var(--accent-text)");
const themeEnd = css.indexOf("}", css.indexOf("@theme static"));
const landingStart = css.indexOf("/* ─── Landing page");
let head = css.slice(0, themeEnd + 1);
let mid = css.slice(themeEnd + 1, landingStart);
const tail = css.slice(landingStart);
mid = mid.replace(/#([0-9A-Fa-f]{6})\b/g, (m, h) => {
  const H = h.toUpperCase();
  if (!isNeutral(H)) return m;
  if (!used.has(H)) used.set(H, new Set());
  // in CSS, guess role from the property on the same line
  used.get(H).add("css");
  return `var(--n-${H.toLowerCase()})`;
});
// html/body follow the theme tokens
mid = mid.replace(/background-color: var\(--n-05050a\);/, "background-color: var(--color-canvas);");
css = head + mid + tail;

// 3) generate the variable block
const darkVars = [];
const lightVars = [];
for (const [H, kinds] of [...used.entries()].sort()) {
  const kind = kinds.has("text") && !kinds.has("surface") ? "text" : lum(H) >= 100 ? "text" : "surface";
  darkVars.push(`  --n-${H.toLowerCase()}: #${H.toLowerCase()};`);
  lightVars.push(`  --n-${H.toLowerCase()}: ${lightOf(H, kind)};`);
}
const block = `
/* ─── Day / night themes ───────────────────────────────────────────────────────────────
 * <html data-theme="dark|light"> (set before paint by the root layout, toggled by ThemeToggle).
 * App colours are CSS variables: --n-* are the neutral surfaces/borders/greys, --accent* are the hero
 * violet/cyan that replaced the old green. The landing page pins data-theme="dark".
 * Generated by the theme codemod from the colours the screens actually use.
 */
:root,
[data-theme="dark"] {
  color-scheme: dark;
  --accent: #9d8cff;
  --accent-strong: #8b7bff;
  --accent-text: #c7bfff;
  --good: #6ad8ff;
  --good-text: #a8e8ff;
${darkVars.join("\n")}
}

[data-theme="light"] {
  color-scheme: light;
  --accent: #6d5dfc;
  --accent-strong: #5646e8;
  --accent-text: #5646e8;
  --good: #0b8fc0;
  --good-text: #0a6f96;
  --color-white: #14141f;
  --color-black: #ffffff;
  --color-canvas: #f4f4f9;
  --color-surface: #ffffff;
  --color-raised: #f7f7fb;
  --color-hover: rgba(20, 20, 40, 0.05);
  --color-line: #e2e2ec;
  --color-line-strong: #cfcfdd;
  --color-fg: #14141f;
  --color-muted: #555568;
  --color-faint: #8a8a9c;
  --color-brand: #14141f;
  --color-brand-strong: #14141f;
  --color-brand-soft: rgba(20, 20, 40, 0.06);
  --color-accent: #14141f;
  --color-accent-soft: rgba(20, 20, 40, 0.05);
  --color-tone: #14141f;
  --color-tone-soft: rgba(20, 20, 40, 0.06);
${lightVars.join("\n")}
}
`;
css = css.replace(/\n\/\* ─── Day \/ night themes[\s\S]*$/, "");
fs.writeFileSync(cssPath, css + block);

console.log(JSON.stringify({ files: files.length, fileChanges, classHits, vars: used.size }));
