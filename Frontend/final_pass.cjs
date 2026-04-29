/**
 * FINAL PASS: Global premium UI polish script
 * - Adds page-enter class to all page roots
 * - Fixes tutor card dark: prefix patterns in SearchTutors
 * - Removes leftover dark:bg-black/40 container overrides
 * - Replaces inline rgba(0,0,0,0.4) backgrounds with transparent
 */
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let out = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) out = out.concat(walk(full));
    else if (/\.tsx$/.test(f)) out.push(full);
  }
  return out;
}

const srcDir = path.join(__dirname, 'src/app/pages');
const files = walk(srcDir);

const replacements = [
  // Add page-enter to the main page root div (only where missing)
  [/className="min-h-screen">/g, 'className="min-h-screen page-enter">'],
  [/className="min-h-screen flex">/g, 'className="min-h-screen flex page-enter">'],

  // Fix dark: prefix text color patterns to consistent white values
  [/dark:text-white\b/g, 'text-white'],
  [/dark:text-gray-100\b/g, 'text-white/95'],
  [/dark:text-gray-200\b/g, 'text-white/90'],
  [/dark:text-gray-300\b/g, 'text-white/80'],
  [/dark:text-gray-400\b/g, 'text-white/60'],
  [/dark:text-gray-500\b/g, 'text-white/45'],
  [/dark:text-white\/50\b/g, 'text-white/45'],
  [/dark:text-white\/70\b/g, 'text-white/65'],

  // Fix dark: border patterns
  [/dark:border-white\/5\b/g, 'border-white/8'],
  [/dark:border-white\/10\b/g, 'border-white/10'],

  // Fix dark: background patterns on cards/containers
  [/dark:bg-white\/5\b/g, ''],
  [/dark:bg-black\/40\b/g, ''],
  [/dark:bg-black\/60\b/g, ''],
  [/dark:backdrop-blur-xl\b/g, ''],
  [/dark:hover:bg-white\/10\b/g, ''],
  [/dark:hover:bg-white\/20\b/g, ''],
  [/dark:hover:border-white\/10\b/g, ''],

  // Fix subject pill colors
  [/dark:bg-\[#6C63FF\]\/10\b/g, ''],
  [/dark:text-\[#a099ff\]\b/g, ''],

  // Fix card bg pattern to use premium-card or direct glass
  [/bg-white\/5 backdrop-blur-lg rounded-3xl border (dark:border-white\/5 )?border-white\/6 hover:shadow-xl (dark:hover:border-white\/10 )?hover:border-white\/8 transition-all duration-300 hover:-translate-y-1 overflow-hidden/g,
   'premium-card card-hover overflow-hidden'],
  [/bg-white\/5 backdrop-blur-lg rounded-2xl p-4 border (dark:border-white\/5 )?border-white\/6 hover:shadow-md (dark:hover:border-white\/10 )?hover:border-white\/8 transition-all duration-200 hover:-translate-y-0\.5 text-left/g,
   'premium-card card-hover text-left'],
  [/bg-white\/5 backdrop-blur-lg rounded-2xl p-6 border (dark:border-white\/5 )?border-white\/6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-left/g,
   'premium-card card-hover p-6 text-left'],
  [/bg-white\/5 backdrop-blur-lg rounded-2xl p-5 border (dark:border-white\/5 )?border-white\/6/g,
   'premium-card p-5'],
  [/bg-white\/5 backdrop-blur-lg rounded-2xl p-4 border (dark:border-white\/5 )?border-white\/6/g,
   'premium-card p-4'],

  // Navbar pattern cleanup
  [/dark:bg-black\/60 dark:backdrop-blur-xl\/90 bg-white\/90 backdrop-blur-lg border-b dark:border-white\/5 border-gray-200/g,
   'glass-header border-b'],

  // Admin card style: rgba(0,0,0,0.4)
  [/background: 'rgba\(0,0,0,0\.4\)',\s*backdropFilter: 'blur\(16px\)',\s*/g, ''],
];

let totalPatched = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  for (const [from, to] of replacements) {
    content = content.replace(from, to);
  }
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalPatched++;
    console.log('  ✓', path.basename(file));
  }
}
console.log(`\n✅ Final pass complete — ${totalPatched} pages upgraded.`);
