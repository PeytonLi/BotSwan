import type { Violation } from "@botswan/shared";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function topViolations(violations: Violation[], limit = 3): Violation[] {
  const order: Record<Violation["severity"], number> = {
    critical: 0,
    major: 1,
    minor: 2,
  };
  return [...violations]
    .sort((a, b) => order[a.severity] - order[b.severity])
    .slice(0, limit);
}

export function generateReportCardHtml(
  violations: Violation[],
  grade: string,
  trustScore: number,
): string {
  const top = topViolations(violations);
  const violationItems = top
    .map(
      (v) =>
        `<li class="violation ${v.severity}"><strong>${escapeHtml(v.title)}</strong><p>${escapeHtml(v.explanation)}</p></li>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BotSwan Report Card — Grade ${escapeHtml(grade)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
    .grade { font-size: 4rem; font-weight: 800; line-height: 1; }
    .trust { font-size: 1.25rem; color: #555; margin-bottom: 1.5rem; }
    .violation { margin-bottom: 1rem; padding: 0.75rem; border-left: 4px solid #ccc; list-style: none; }
    .violation.critical { border-color: #dc2626; }
    .violation.major { border-color: #ea580c; }
    .violation.minor { border-color: #ca8a04; }
  </style>
</head>
<body>
  <header>
    <p>BotSwan Report Card</p>
    <div class="grade">${escapeHtml(grade)}</div>
    <div class="trust">Trust score: ${trustScore}/100</div>
  </header>
  <section>
    <h2>Top Violations</h2>
    <ul>${violationItems || "<li>No violations</li>"}</ul>
  </section>
</body>
</html>`;
}

export function generateReportCardSvg(
  violations: Violation[],
  grade: string,
  trustScore: number,
): string {
  const top = topViolations(violations);
  const violationLines = top
    .map(
      (v, i) =>
        `<text x="60" y="${220 + i * 36}" font-size="18" fill="#374151">${escapeXml(v.title)}</text>`,
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0f172a"/>
  <text x="60" y="80" font-size="32" fill="#94a3b8" font-family="system-ui, sans-serif">BotSwan Report Card</text>
  <text x="60" y="200" font-size="160" fill="#f8fafc" font-weight="800" font-family="system-ui, sans-serif">${escapeXml(grade)}</text>
  <text x="60" y="260" font-size="28" fill="#cbd5e1" font-family="system-ui, sans-serif">Trust score: ${trustScore}/100</text>
  ${violationLines}
</svg>`;
}
