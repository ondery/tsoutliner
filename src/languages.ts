/**
 * Language support for the outline view.
 * Uses VS Code language IDs (javascriptreact = JSX, typescriptreact = TSX).
 */
export const SUPPORTED_LANGUAGE_IDS = [
  "typescript",
  "typescriptreact",
  "javascript",
  "javascriptreact",
  "css",
  "scss",
  "less",
  "markdown",
  "json",
  "jsonc",
] as const;

export type SupportedLanguageId = (typeof SUPPORTED_LANGUAGE_IDS)[number];

const SUPPORTED_SET = new Set<string>(SUPPORTED_LANGUAGE_IDS);

export function isSupportedLanguage(languageId: string): boolean {
  return SUPPORTED_SET.has(languageId);
}

export function isCodeLanguage(languageId: string): boolean {
  return (
    languageId === "typescript" ||
    languageId === "typescriptreact" ||
    languageId === "javascript" ||
    languageId === "javascriptreact"
  );
}

export function isCssLanguage(languageId: string): boolean {
  return (
    languageId === "css" ||
    languageId === "scss" ||
    languageId === "less"
  );
}

export function isMarkdownLanguage(languageId: string): boolean {
  return languageId === "markdown";
}

export function isJsonLanguage(languageId: string): boolean {
  return languageId === "json" || languageId === "jsonc";
}

export function languageDisplayName(languageId: string): string {
  switch (languageId) {
    case "typescript":
      return "TypeScript";
    case "typescriptreact":
      return "TSX";
    case "javascript":
      return "JavaScript";
    case "javascriptreact":
      return "JSX";
    case "css":
      return "CSS";
    case "scss":
      return "SCSS";
    case "less":
      return "Less";
    case "markdown":
      return "Markdown";
    case "json":
      return "JSON";
    case "jsonc":
      return "JSONC";
    default:
      return languageId;
  }
}
