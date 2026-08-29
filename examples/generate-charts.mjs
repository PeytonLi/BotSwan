import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const chartsDir = path.join(__dirname, "charts");

const charts = {
  "truncated-axis.svg": truncatedAxis(),
  "cherry-picked.svg": cherryPicked(),
  "simpsons-paradox.svg": simpsonsParadox(),
  "dual-axis.svg": dualAxis(),
  "missing-baseline.svg": missingBaseline(),
  "log-scale.svg": logScale(),
  "sample-size.svg": sampleSize(),
};

function svg(title, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320" width="480" height="320">
  <rect width="480" height="320" fill="#0f172a"/>
  <text x="240" y="28" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="14" text-anchor="middle">${title}</text>
  ${body}
</svg>`;
}

function truncatedAxis() {
  return svg(
    "Truncated Y-axis (starts at 95)",
    `<line x1="60" y1="40" x2="60" y2="260" stroke="#475569" stroke-width="2"/>
     <line x1="60" y1="260" x2="440" y2="260" stroke="#475569" stroke-width="2"/>
     <text x="48" y="265" fill="#64748b" font-size="11">95</text>
     <text x="48" y="200" fill="#64748b" font-size="11">96</text>
     <text x="48" y="140" fill="#64748b" font-size="11">97</text>
     <text x="48" y="80" fill="#64748b" font-size="11">98</text>
     <polyline fill="none" stroke="#22d3ee" stroke-width="3" points="100,250 180,220 260,170 340,110 420,55"/>
     <text x="420" y="48" fill="#22d3ee" font-size="12">+500%!</text>`,
  );
}

function cherryPicked() {
  return svg(
    "Cherry-picked date window",
    `<line x1="60" y1="40" x2="60" y2="260" stroke="#475569" stroke-width="2"/>
     <line x1="60" y1="260" x2="440" y2="260" stroke="#475569" stroke-width="2"/>
     <polyline fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="6 4" points="80,180 120,200 160,190"/>
     <rect x="170" y="50" width="250" height="220" fill="none" stroke="#f97316" stroke-width="2" stroke-dasharray="4"/>
     <polyline fill="none" stroke="#22d3ee" stroke-width="3" points="180,240 240,200 300,150 360,90 410,60"/>
     <text x="295" y="75" fill="#f97316" font-size="11">Selected window only</text>`,
  );
}

function simpsonsParadox() {
  return svg(
    "Simpson's paradox",
    `<line x1="60" y1="40" x2="60" y2="260" stroke="#475569" stroke-width="2"/>
     <line x1="60" y1="260" x2="440" y2="260" stroke="#475569" stroke-width="2"/>
     <polyline fill="none" stroke="#22d3ee" stroke-width="3" points="100,120 420,200"/>
     <polyline fill="none" stroke="#a78bfa" stroke-width="2" points="100,220 420,160"/>
     <polyline fill="none" stroke="#34d399" stroke-width="2" points="100,180 420,140"/>
     <text x="350" y="115" fill="#22d3ee" font-size="11">Aggregate ↑</text>
     <text x="350" y="155" fill="#34d399" font-size="11">Group B ↑</text>
     <text x="350" y="175" fill="#a78bfa" font-size="11">Group A ↓</text>`,
  );
}

function dualAxis() {
  return svg(
    "Dual-axis correlation illusion",
    `<line x1="50" y1="40" x2="50" y2="260" stroke="#475569" stroke-width="2"/>
     <line x1="430" y1="40" x2="430" y2="260" stroke="#475569" stroke-width="2"/>
     <line x1="50" y1="260" x2="430" y2="260" stroke="#475569" stroke-width="2"/>
     <polyline fill="none" stroke="#22d3ee" stroke-width="3" points="80,220 160,180 240,140 320,100 400,70"/>
     <polyline fill="none" stroke="#f472b6" stroke-width="3" points="80,200 160,170 240,130 320,95 400,65"/>
     <text x="55" y="55" fill="#22d3ee" font-size="10">Sales</text>
     <text x="395" y="55" fill="#f472b6" font-size="10">Morale</text>`,
  );
}

function missingBaseline() {
  return svg(
    "Missing baseline / index rebasing",
    `<line x1="60" y1="40" x2="60" y2="260" stroke="#475569" stroke-width="2"/>
     <line x1="60" y1="260" x2="440" y2="260" stroke="#475569" stroke-width="2"/>
     <polyline fill="none" stroke="#22d3ee" stroke-width="3" points="100,200 180,190 260,170 340,140 420,100"/>
     <text x="200" y="290" fill="#64748b" font-size="11">Rebased to 100 — prior context omitted</text>`,
  );
}

function logScale() {
  return svg(
    "Log scale without labeling",
    `<line x1="60" y1="40" x2="60" y2="260" stroke="#475569" stroke-width="2"/>
     <line x1="60" y1="260" x2="440" y2="260" stroke="#475569" stroke-width="2"/>
     <path fill="none" stroke="#22d3ee" stroke-width="3" d="M100,250 C160,240 220,180 280,120 340,70 400,50"/>
     <text x="300" y="290" fill="#f97316" font-size="11">Linear-looking log curve</text>`,
  );
}

function sampleSize() {
  return svg(
    "Tiny sample, bold trend",
    `<line x1="60" y1="40" x2="60" y2="260" stroke="#475569" stroke-width="2"/>
     <line x1="60" y1="260" x2="440" y2="260" stroke="#475569" stroke-width="2"/>
     <circle cx="120" cy="210" r="6" fill="#22d3ee"/>
     <circle cx="200" cy="180" r="6" fill="#22d3ee"/>
     <circle cx="280" cy="150" r="6" fill="#22d3ee"/>
     <circle cx="360" cy="100" r="6" fill="#22d3ee"/>
     <line x1="120" y1="210" x2="360" y2="100" stroke="#22d3ee" stroke-width="2"/>
     <text x="280" y="290" fill="#64748b" font-size="11">n=4 per point</text>`,
  );
}

await mkdir(chartsDir, { recursive: true });
for (const [filename, content] of Object.entries(charts)) {
  await writeFile(path.join(chartsDir, filename), content, "utf8");
}
console.log(`Wrote ${Object.keys(charts).length} chart SVGs to ${chartsDir}`);
