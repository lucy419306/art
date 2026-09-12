const fs = require('node:fs');
const path = require('node:path');
const cues = require('../src/voice-cues.js');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'voice');
const checkOnly = process.argv.includes('--check');
const copied = new Set();
const missing = new Map();
function noteMissing(id, cue, target) {
  const item = missing.get(target) || { ids: [], source: cue.source, target };
  item.ids.push(id);
  missing.set(target, item);
}

for (const [id, cue] of Object.entries(cues)) {
  const target = path.resolve(root, 'src', cue.file);
  if (!cue.source) continue;
  const source = path.join(sourceRoot, cue.source);
  if (!fs.existsSync(source)) {
    if (cue.required) noteMissing(id, cue, target);
    continue;
  }
  if (!checkOnly && !copied.has(target)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    copied.add(target);
  }
}

for (const [id, cue] of Object.entries(cues)) {
  const target = path.resolve(root, 'src', cue.file);
  if (cue.required && !fs.existsSync(target) && !missing.has(target)) {
    noteMissing(id, cue, target);
  }
}

const imported = checkOnly ? 'checked' : `copied ${copied.size}`;
console.log(`Voice assets: ${imported}; required recordings missing: ${missing.size}`);
for (const item of missing.values()) console.log(`MISSING ${item.ids.join(', ')} -> ${path.relative(root, item.target)}`);
if (checkOnly && missing.size) process.exitCode = 1;
