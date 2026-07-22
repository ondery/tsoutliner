const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "media", "icons");
const outFile = path.join(__dirname, "..", "src", "icons", "catalog.ts");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".svg")).sort();

const entries = [];
for (const file of files) {
  const id = file.replace(/\.svg$/, "").replace(/^lucide-/, "lucide:");
  let svg = fs.readFileSync(path.join(dir, file), "utf8").trim();
  svg = svg.replace(/width="16" height="16"/, 'width="100%" height="100%"');
  const escaped = svg.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
  entries.push(`  "${id}": \`${escaped}\``);
}

const out = `/**
 * Bundled Lucide icons (Iconify IDs).
 * Users pick icons via settings using prefix:name IDs (e.g. lucide:box).
 * Regenerate with: node scripts/generate-icon-catalog.js
 */
export const ICON_CATALOG: Record<string, string> = {
${entries.join(",\n")}
};

export const FALLBACK_ICON_ID = "lucide:help-circle";

export function listCatalogIds(): string[] {
  return Object.keys(ICON_CATALOG);
}

export function resolveIconSvg(iconId: string): string {
  return ICON_CATALOG[iconId] ?? ICON_CATALOG[FALLBACK_ICON_ID];
}
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, out);
console.log(`Wrote ${entries.length} icons to ${outFile}`);
