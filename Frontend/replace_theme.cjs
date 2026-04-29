/**
 * Comprehensive theme migration — kills ALL remaining light-theme backgrounds
 * across every .tsx / .ts / .css file in src/
 */
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let out = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) out = out.concat(walk(full));
    else if (/\.(tsx|ts|css)$/.test(f)) out.push(full);
  }
  return out;
}

const srcDir = path.join(__dirname, 'src');
const files = walk(srcDir);

// Ordered replacements: most specific first
const replacements = [
  // ── PAGE ROOT: min-h-screen + light bg combos ──
  [/min-h-screen\s+(dark:bg-\S+\s+)*bg-(?:gray|white|slate|indigo|purple|blue|amber|teal|green|red|orange|zinc|neutral)-(?:50|100)?/g, 'min-h-screen'],
  [/min-h-screen flex\s+(dark:bg-\S+\s+)*bg-(?:gray|white|slate|indigo|purple|blue|amber|teal|green|red|orange|zinc|neutral)-(?:50|100)?/g, 'min-h-screen flex'],
  [/bg-gradient-to-br from-indigo-50[^"']*/g, ''],
  [/bg-gradient-to-br from-slate-50[^"']*/g, ''],
  [/bg-gradient-to-br from-purple-50[^"']*/g, ''],
  [/bg-gradient-to-br from-blue-50[^"']*/g, ''],
  [/bg-gradient-to-br from-gray-50[^"']*/g, ''],

  // ── heading / text light colors ──
  [/\btext-gray-900\b/g, 'text-white'],
  [/\btext-gray-800\b/g, 'text-white'],
  [/\btext-gray-700\b/g, 'text-white/90'],
  [/\btext-gray-600\b/g, 'text-white/70'],
  [/\btext-gray-500\b/g, 'text-white/50'],
  [/\btext-slate-900\b/g, 'text-white'],
  [/\btext-slate-800\b/g, 'text-white'],
  [/\btext-slate-700\b/g, 'text-white/90'],
  [/\btext-slate-600\b/g, 'text-white/70'],
  [/\btext-slate-500\b/g, 'text-white/50'],

  // ── Card light backgrounds ──
  [/\bbg-white\b(?!\s*\/)/g, 'bg-white/5'],
  [/\bbg-gray-50\b/g, 'bg-white/5'],
  [/\bbg-gray-100\b/g, 'bg-white/8'],
  [/\bbg-slate-50\b/g, 'bg-white/5'],
  [/\bbg-slate-100\b/g, 'bg-white/8'],

  // ── inline style solid dark remnants ──
  [/background:\s*'rgba\(0,0,0,0\.4\)',\s*backdropFilter:\s*'blur\(16px\)',?\s*/g, ''],
  [/background:\s*'rgba\(10,5,30,0\.55\)',\s*backdropFilter:\s*'blur\(18px\)'/g, "background: 'rgba(255,255,255,0.055)', backdropFilter: 'blur(16px)'"],
  [/'#080810'/g, "'rgba(6,4,15,0)'"],
  [/'#0D0D1A'/g, "'rgba(6,4,15,0)'"],
  [/'#1A1A2E'/g, "'rgba(255,255,255,0.05)'"],
  [/'#12131F'/g, "'rgba(6,4,15,0.7)'"],
  [/'#1E1E30'/g, "'rgba(255,255,255,0.05)'"],

  // ── border light ──
  [/\bborder-gray-200\b/g, 'border-white/8'],
  [/\bborder-gray-100\b/g, 'border-white/6'],
  [/\bborder-gray-300\b/g, 'border-white/10'],
  [/\bborder-slate-200\b/g, 'border-white/8'],

  // ── dark: prefix doubles + gray backgrounds ──
  [/dark:bg-gray-\d{3}/g, 'dark:bg-white/5'],
  [/dark:bg-slate-\d{3}/g, 'dark:bg-white/5'],
  [/dark:border-gray-\d{3}/g, 'dark:border-white/8'],

  // ── Placeholder text light ──
  [/\bplaceholder:text-gray-\d{3}\b/g, 'placeholder:text-white/30'],
  [/dark:placeholder:text-gray-\d{3}\b/g, 'dark:placeholder:text-white/30'],

  // ── teal subject pills ──
  [/bg-teal-50\s+text-teal-800/g, 'bg-white/8 text-white/80'],
  [/bg-teal-\d{2,3}/g, 'bg-white/8'],
  [/text-teal-\d{2,3}/g, 'text-purple-300'],

  // ── shadow-md / shadow-lg with light context words removed ──
  [/dark:shadow-none/g, ''],
];

let fileCount = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  for (const [from, to] of replacements) {
    content = content.replace(from, to);
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    fileCount++;
    console.log('  ✓', path.relative(srcDir, file));
  }
}

console.log(`\n✅ Patched ${fileCount} files.`);
