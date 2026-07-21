import * as vscode from "vscode";
import {
  isCodeLanguage,
  isJsonLanguage,
  isMarkdownLanguage,
  isSupportedLanguage,
} from "./languages";
import {
  Modifier,
  OutlineNode,
  OutlineNodeType,
  Visibility,
} from "./types";

/**
 * Parses the active editor into an outline tree using document symbols (LSP)
 * with language-aware fallbacks for TypeScript/JavaScript, Markdown, and JSON.
 */
export class OutlineParser {
  async parseActiveFile(): Promise<OutlineNode[]> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !isSupportedLanguage(editor.document.languageId)) {
      return [];
    }

    const languageId = editor.document.languageId;

    try {
      const symbols = (await vscode.commands.executeCommand(
        "vscode.executeDocumentSymbolProvider",
        editor.document.uri
      )) as vscode.DocumentSymbol[] | undefined;

      if (!symbols || symbols.length === 0) {
        return this.fallbackParse(editor.document);
      }

      const nodes = await this.convertSymbolsToNodes(symbols, languageId);
      return nodes.filter((node): node is OutlineNode => node !== null);
    } catch (error) {
      console.error("Error getting document symbols:", error);
      return this.fallbackParse(editor.document);
    }
  }

  private async convertSymbolsToNodes(
    symbols: vscode.DocumentSymbol[],
    languageId: string
  ): Promise<(OutlineNode | null)[]> {
    return Promise.all(
      symbols.map((symbol) => this.convertSymbolToNode(symbol, languageId))
    );
  }

  private async convertSymbolToNode(
    symbol: vscode.DocumentSymbol,
    languageId: string
  ): Promise<OutlineNode | null> {
    let nodeType = this.mapSymbolKindToNodeType(symbol.kind, languageId);
    if (!nodeType) {
      return null;
    }

    if (nodeType === "method" && isCodeLanguage(languageId)) {
      nodeType = await this.detectGetterSetterType(symbol);
    }

    const { visibility, modifiers } = await this.extractVisibilityAndModifiers(
      symbol,
      languageId
    );

    const children = symbol.children
      ? (
          await this.convertSymbolsToNodes(symbol.children, languageId)
        ).filter((node): node is OutlineNode => node !== null)
      : undefined;

    return {
      name: symbol.name,
      type: nodeType,
      visibility,
      modifiers,
      line: symbol.range.start.line,
      children,
    };
  }

  private mapSymbolKindToNodeType(
    kind: vscode.SymbolKind,
    languageId: string
  ): OutlineNodeType | null {
    if (isMarkdownLanguage(languageId)) {
      // Built-in Markdown symbols are typically String (headings)
      if (
        kind === vscode.SymbolKind.String ||
        kind === vscode.SymbolKind.Number ||
        kind === vscode.SymbolKind.File ||
        kind === vscode.SymbolKind.Package ||
        kind === vscode.SymbolKind.Namespace ||
        kind === vscode.SymbolKind.Object ||
        kind === vscode.SymbolKind.Array
      ) {
        return "heading";
      }
    }

    if (isJsonLanguage(languageId)) {
      switch (kind) {
        case vscode.SymbolKind.Array:
          return "array";
        case vscode.SymbolKind.Object:
        case vscode.SymbolKind.Module:
        case vscode.SymbolKind.Namespace:
        case vscode.SymbolKind.Package:
          return "object";
        case vscode.SymbolKind.Property:
        case vscode.SymbolKind.Field:
        case vscode.SymbolKind.Key:
        case vscode.SymbolKind.String:
        case vscode.SymbolKind.Number:
        case vscode.SymbolKind.Boolean:
        case vscode.SymbolKind.Null:
        case vscode.SymbolKind.Variable:
        case vscode.SymbolKind.Constant:
          return "key";
        default:
          return "key";
      }
    }

    switch (kind) {
      case vscode.SymbolKind.File:
        return "file";
      case vscode.SymbolKind.Module:
      case vscode.SymbolKind.Package:
        return "module";
      case vscode.SymbolKind.Namespace:
        return "namespace";
      case vscode.SymbolKind.Class:
        return "class";
      case vscode.SymbolKind.Method:
        return "method";
      case vscode.SymbolKind.Property:
        return "property";
      case vscode.SymbolKind.Field:
        return "property";
      case vscode.SymbolKind.Constructor:
        return "constructor";
      case vscode.SymbolKind.Enum:
        return "enum";
      case vscode.SymbolKind.Interface:
        return "interface";
      case vscode.SymbolKind.Function:
        return "function";
      case vscode.SymbolKind.Variable:
        return "variable";
      case vscode.SymbolKind.Constant:
        return "constant";
      case vscode.SymbolKind.String:
      case vscode.SymbolKind.Number:
      case vscode.SymbolKind.Boolean:
      case vscode.SymbolKind.Array:
      case vscode.SymbolKind.Object:
      case vscode.SymbolKind.Key:
        return isMarkdownLanguage(languageId) ? "heading" : "variable";
      case vscode.SymbolKind.EnumMember:
        return "enumMember";
      case vscode.SymbolKind.Struct:
        return "class";
      case vscode.SymbolKind.Event:
        return "event";
      case vscode.SymbolKind.Operator:
        return "operator";
      case vscode.SymbolKind.TypeParameter:
        return "typeParameter";
      default:
        return null;
    }
  }

  private async detectGetterSetterType(
    symbol: vscode.DocumentSymbol
  ): Promise<OutlineNodeType> {
    const detail = symbol.detail || "";
    const name = symbol.name || "";

    if (detail.includes("(get)") || detail.includes("getter")) {
      return "getter";
    }
    if (detail.includes("(set)") || detail.includes("setter")) {
      return "setter";
    }
    if (name.startsWith("get ") || name.startsWith("get_")) {
      return "getter";
    }
    if (name.startsWith("set ") || name.startsWith("set_")) {
      return "setter";
    }

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      try {
        const lineText = editor.document.lineAt(symbol.range.start.line).text.trim();
        if (
          /^\s*(public\s+|private\s+|protected\s+|static\s+)*get\s+\w+/.test(
            lineText
          )
        ) {
          return "getter";
        }
        if (
          /^\s*(public\s+|private\s+|protected\s+|static\s+)*set\s+\w+/.test(
            lineText
          )
        ) {
          return "setter";
        }
      } catch (error) {
        console.error("Error detecting getter/setter:", error);
      }
    }

    return "method";
  }

  private async extractVisibilityAndModifiers(
    symbol: vscode.DocumentSymbol,
    languageId: string
  ): Promise<{ visibility: Visibility; modifiers: Modifier[] }> {
    if (isMarkdownLanguage(languageId) || isJsonLanguage(languageId)) {
      return { visibility: "none", modifiers: [] };
    }

    const detail = symbol.detail || "";
    let visibility: Visibility = "public";
    const modifiers: Modifier[] = [];

    if (detail.includes("private")) {
      visibility = "private";
    } else if (detail.includes("protected")) {
      visibility = "protected";
    } else if (detail.includes("public")) {
      visibility = "public";
    } else {
      const fromSource = await this.getVisibilityFromSource(symbol);
      if (fromSource.visibility) {
        visibility = fromSource.visibility;
      }
      modifiers.push(...fromSource.modifiers);
    }

    if (detail.includes("static")) {
      modifiers.push("static");
    }
    if (detail.includes("readonly")) {
      modifiers.push("readonly");
    }
    if (detail.includes("abstract")) {
      modifiers.push("abstract");
    }
    if (detail.includes("async")) {
      modifiers.push("async");
    }
    if (detail.includes("export") || this.isTopLevelExport(symbol)) {
      modifiers.push("export");
    }

    if (symbol.kind === vscode.SymbolKind.Constructor) {
      if (detail.includes("private constructor")) {
        visibility = "private";
      } else if (detail.includes("protected constructor")) {
        visibility = "protected";
      }
    }

    return { visibility, modifiers: [...new Set(modifiers)] };
  }

  private async getVisibilityFromSource(
    symbol: vscode.DocumentSymbol
  ): Promise<{ visibility?: Visibility; modifiers: Modifier[] }> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return { modifiers: [] };
    }

    try {
      const lineText = editor.document.lineAt(symbol.range.start.line).text.trim();
      let visibility: Visibility | undefined;
      const modifiers: Modifier[] = [];

      if (lineText.includes("private ")) {
        visibility = "private";
      } else if (lineText.includes("protected ")) {
        visibility = "protected";
      } else if (lineText.includes("public ")) {
        visibility = "public";
      }

      if (lineText.includes("static ")) {
        modifiers.push("static");
      }
      if (lineText.includes("readonly ")) {
        modifiers.push("readonly");
      }
      if (lineText.includes("abstract ")) {
        modifiers.push("abstract");
      }
      if (lineText.includes("async ")) {
        modifiers.push("async");
      }
      if (lineText.includes("export ")) {
        modifiers.push("export");
      }
      if (lineText.includes("export default ")) {
        modifiers.push("default");
      }

      return { visibility, modifiers };
    } catch (error) {
      console.error("Error reading source for visibility:", error);
      return { modifiers: [] };
    }
  }

  private isTopLevelExport(symbol: vscode.DocumentSymbol): boolean {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return false;
    }
    try {
      return editor.document
        .lineAt(symbol.range.start.line)
        .text.trim()
        .startsWith("export");
    } catch {
      return false;
    }
  }

  private fallbackParse(document: vscode.TextDocument): OutlineNode[] {
    if (isMarkdownLanguage(document.languageId)) {
      return this.fallbackMarkdownParsing(document);
    }
    if (isJsonLanguage(document.languageId)) {
      return this.fallbackJsonParsing(document);
    }
    if (isCodeLanguage(document.languageId)) {
      return this.fallbackCodeParsing(document);
    }
    return [];
  }

  /**
   * Fallback JSON/JSONC tree when document symbols are unavailable.
   * Strips // and /* *\/ comments for JSONC before parsing.
   */
  private fallbackJsonParsing(document: vscode.TextDocument): OutlineNode[] {
    const text = document.getText();
    try {
      const jsonText =
        document.languageId === "jsonc" ? this.stripJsoncComments(text) : text;
      const data = JSON.parse(jsonText) as unknown;
      const searchState = { fromIndex: 0 };
      if (Array.isArray(data)) {
        return this.jsonArrayToNodes(data, text, searchState, "");
      }
      if (data !== null && typeof data === "object") {
        return this.jsonObjectToNodes(
          data as Record<string, unknown>,
          text,
          searchState
        );
      }
      return [];
    } catch (error) {
      console.error("JSON fallback parse failed:", error);
      return [];
    }
  }

  private stripJsoncComments(text: string): string {
    let result = "";
    let i = 0;
    let inString = false;
    let escape = false;

    while (i < text.length) {
      const ch = text[i];
      const next = text[i + 1];

      if (inString) {
        result += ch;
        if (escape) {
          escape = false;
        } else if (ch === "\\") {
          escape = true;
        } else if (ch === '"') {
          inString = false;
        }
        i++;
        continue;
      }

      if (ch === '"') {
        inString = true;
        result += ch;
        i++;
        continue;
      }

      if (ch === "/" && next === "/") {
        i += 2;
        while (i < text.length && text[i] !== "\n") {
          i++;
        }
        continue;
      }

      if (ch === "/" && next === "*") {
        i += 2;
        while (i + 1 < text.length && !(text[i] === "*" && text[i + 1] === "/")) {
          i++;
        }
        i += 2;
        continue;
      }

      result += ch;
      i++;
    }

    return result;
  }

  private jsonObjectToNodes(
    obj: Record<string, unknown>,
    source: string,
    searchState: { fromIndex: number }
  ): OutlineNode[] {
    return Object.entries(obj).map(([key, value]) =>
      this.jsonEntryToNode(key, value, source, searchState)
    );
  }

  private jsonArrayToNodes(
    arr: unknown[],
    source: string,
    searchState: { fromIndex: number },
    parentKey: string
  ): OutlineNode[] {
    return arr.map((value, index) => {
      const name = parentKey ? `${parentKey}[${index}]` : `[${index}]`;
      const line = this.findJsonValueLine(source, searchState, index, true);
      return this.jsonValueToNode(name, value, source, searchState, line);
    });
  }

  private jsonEntryToNode(
    key: string,
    value: unknown,
    source: string,
    searchState: { fromIndex: number }
  ): OutlineNode {
    const line = this.findJsonKeyLine(source, searchState, key);
    return this.jsonValueToNode(key, value, source, searchState, line);
  }

  private jsonValueToNode(
    name: string,
    value: unknown,
    source: string,
    searchState: { fromIndex: number },
    line: number
  ): OutlineNode {
    if (Array.isArray(value)) {
      return {
        name,
        type: "array",
        visibility: "none",
        modifiers: [],
        line,
        children: this.jsonArrayToNodes(value, source, searchState, name),
      };
    }

    if (value !== null && typeof value === "object") {
      return {
        name,
        type: "object",
        visibility: "none",
        modifiers: [],
        line,
        children: this.jsonObjectToNodes(
          value as Record<string, unknown>,
          source,
          searchState
        ),
      };
    }

    return {
      name,
      type: "key",
      visibility: "none",
      modifiers: [],
      line,
    };
  }

  private findJsonKeyLine(
    source: string,
    searchState: { fromIndex: number },
    key: string
  ): number {
    const pattern = new RegExp(
      `"${this.escapeRegExp(key)}"\\s*:`,
      "g"
    );
    pattern.lastIndex = searchState.fromIndex;
    const match = pattern.exec(source);
    if (!match) {
      return this.offsetToLine(source, searchState.fromIndex);
    }
    searchState.fromIndex = match.index + match[0].length;
    return this.offsetToLine(source, match.index);
  }

  private findJsonValueLine(
    source: string,
    searchState: { fromIndex: number },
    _index: number,
    _isArray: boolean
  ): number {
    const line = this.offsetToLine(source, searchState.fromIndex);
    // Advance past the next structural token to keep subsequent lookups moving forward
    const next = source.slice(searchState.fromIndex).search(/[\[{,"\d\-tfn]/);
    if (next >= 0) {
      searchState.fromIndex += next + 1;
    }
    return line;
  }

  private offsetToLine(source: string, offset: number): number {
    const safeOffset = Math.max(0, Math.min(offset, source.length));
    let line = 0;
    for (let i = 0; i < safeOffset; i++) {
      if (source[i] === "\n") {
        line++;
      }
    }
    return line;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private fallbackMarkdownParsing(document: vscode.TextDocument): OutlineNode[] {
    const lines = document.getText().split("\n");
    const root: OutlineNode[] = [];
    const stack: { level: number; node: OutlineNode }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^(#{1,6})\s+(.+?)\s*$/);
      if (!match) {
        continue;
      }

      const level = match[1].length;
      const node: OutlineNode = {
        name: match[2].trim(),
        type: "heading",
        visibility: "none",
        modifiers: [],
        line: i,
        children: [],
      };

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(node);
      } else {
        const parent = stack[stack.length - 1].node;
        parent.children = parent.children || [];
        parent.children.push(node);
      }

      stack.push({ level, node });
    }

    return root;
  }

  private fallbackCodeParsing(document: vscode.TextDocument): OutlineNode[] {
    const lines = document.getText().split("\n");
    const nodes: OutlineNode[] = [];
    let currentClass: OutlineNode | null = null;
    let braceCount = 0;
    let inClass = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*")) {
        continue;
      }

      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceCount += openBraces - closeBraces;

      if (this.isClassOrInterface(trimmed)) {
        const classInfo = this.parseClassOrInterface(trimmed);
        if (classInfo) {
          currentClass = {
            name: classInfo.name,
            type: classInfo.type,
            visibility: classInfo.visibility,
            modifiers: classInfo.modifiers,
            line: i,
            children: [],
          };
          nodes.push(currentClass);
          inClass = true;
          continue;
        }
      }

      if (currentClass && inClass && braceCount > 0) {
        const member = this.parseMember(trimmed, i);
        if (member) {
          currentClass.children = currentClass.children || [];
          currentClass.children.push(member);
          continue;
        }
      }

      if (braceCount === 0 && inClass) {
        inClass = false;
        currentClass = null;
      }

      if (!inClass) {
        const func = this.parseTopLevelFunction(trimmed, i);
        if (func) {
          nodes.push(func);
        }
      }
    }

    return nodes;
  }

  private isClassOrInterface(line: string): boolean {
    return /^(export\s+)?(abstract\s+)?(class|interface)\s+\w+/.test(line);
  }

  private parseClassOrInterface(line: string): Omit<OutlineNode, "line" | "children"> | null {
    const match = line.match(
      /^(export\s+)?(abstract\s+)?(class|interface)\s+(\w+)/
    );
    if (!match) {
      return null;
    }

    const modifiers: Modifier[] = [];
    if (match[1]) {
      modifiers.push("export");
    }
    if (match[2]) {
      modifiers.push("abstract");
    }

    return {
      name: match[4],
      type: match[3] as "class" | "interface",
      visibility: "public",
      modifiers,
    };
  }

  private parseMember(line: string, lineNumber: number): OutlineNode | null {
    if (!line.trim() || line.trim().startsWith("//") || line.trim().startsWith("/*")) {
      return null;
    }

    const skipKeywords = new Set([
      "if",
      "else",
      "for",
      "while",
      "switch",
      "case",
      "default",
      "try",
      "catch",
      "finally",
      "return",
      "throw",
      "break",
      "continue",
      "const",
      "let",
      "var",
      "import",
      "export",
      "from",
    ]);

    const firstWord = line.trim().split(/\s+/)[0];
    if (skipKeywords.has(firstWord)) {
      return null;
    }

    if (/^\s*(public\s+|private\s+|protected\s+)?constructor\s*\(/.test(line)) {
      const visAndMod = this.extractVisibilityAndModifiersFromLine(line);
      return {
        name: "constructor",
        type: "constructor",
        visibility: visAndMod.visibility,
        modifiers: visAndMod.modifiers,
        line: lineNumber,
      };
    }

    const getterMatch = line.match(
      /^\s*(public\s+|private\s+|protected\s+|static\s+)*get\s+(\w+)\s*\(\s*\)\s*[:{\s]/
    );
    if (getterMatch) {
      const visAndMod = this.extractVisibilityAndModifiersFromLine(line);
      return {
        name: `get ${getterMatch[2]}`,
        type: "getter",
        visibility: visAndMod.visibility,
        modifiers: visAndMod.modifiers,
        line: lineNumber,
      };
    }

    const setterMatch = line.match(
      /^\s*(public\s+|private\s+|protected\s+|static\s+)*set\s+(\w+)\s*\([^)]+\)\s*[:{\s]/
    );
    if (setterMatch) {
      const visAndMod = this.extractVisibilityAndModifiersFromLine(line);
      return {
        name: `set ${setterMatch[2]}`,
        type: "setter",
        visibility: visAndMod.visibility,
        modifiers: visAndMod.modifiers,
        line: lineNumber,
      };
    }

    const methodPatterns = [
      /^\s*(public\s+|private\s+|protected\s+|static\s+|async\s+)*(async\s+)?(\w+)\s*\([^)]*\)\s*:\s*[^=\{]*\s*\{/,
      /^\s*(public\s+|private\s+|protected\s+|static\s+|async\s+)*(async\s+)?(\w+)\s*\([^)]*\)\s*\{/,
      /^\s*(public\s+|private\s+|protected\s+|static\s+|async\s+)*(async\s+)?(\w+)\s*\([^)]*\)\s*:\s*[^;]+;/,
    ];

    for (const pattern of methodPatterns) {
      const match = line.match(pattern);
      if (match) {
        const methodName = match[3] || match[2];
        if (methodName && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(methodName)) {
          const visAndMod = this.extractVisibilityAndModifiersFromLine(line);
          return {
            name: methodName,
            type: "method",
            visibility: visAndMod.visibility,
            modifiers: visAndMod.modifiers,
            line: lineNumber,
          };
        }
      }
    }

    const propertyPatterns = [
      /^\s*(public\s+|private\s+|protected\s+|static\s+|readonly\s+)*(\w+)\s*:\s*[^=;]+\s*=\s*[^;]+;/,
      /^\s*(public\s+|private\s+|protected\s+|static\s+|readonly\s+)*(\w+)\s*:\s*[^;]+;/,
      /^\s*(public\s+|private\s+|protected\s+|static\s+|readonly\s+)*(\w+)\s*=\s*[^;]+;/,
    ];

    for (const pattern of propertyPatterns) {
      const match = line.match(pattern);
      if (match) {
        const propName = match[2];
        if (
          propName &&
          /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propName) &&
          !line.includes("(")
        ) {
          const visAndMod = this.extractVisibilityAndModifiersFromLine(line);
          return {
            name: propName,
            type: "property",
            visibility: visAndMod.visibility,
            modifiers: visAndMod.modifiers,
            line: lineNumber,
          };
        }
      }
    }

    return null;
  }

  private parseTopLevelFunction(
    line: string,
    lineNumber: number
  ): OutlineNode | null {
    const exportDefaultAsyncMatch = line.match(
      /^export\s+default\s+async\s+function\s+(\w+)/
    );
    if (exportDefaultAsyncMatch) {
      return {
        name: exportDefaultAsyncMatch[1],
        type: "function",
        visibility: "public",
        modifiers: ["export", "default", "async"],
        line: lineNumber,
      };
    }

    const exportDefaultMatch = line.match(
      /^export\s+default\s+function\s+(\w+)/
    );
    if (exportDefaultMatch) {
      return {
        name: exportDefaultMatch[1],
        type: "function",
        visibility: "public",
        modifiers: ["export", "default"],
        line: lineNumber,
      };
    }

    const funcMatch = line.match(/^(export\s+)?(async\s+)?function\s+(\w+)/);
    if (funcMatch) {
      const modifiers: Modifier[] = [];
      if (funcMatch[2]) {
        modifiers.push("async");
      }
      if (funcMatch[1]) {
        modifiers.push("export");
      }
      return {
        name: funcMatch[3],
        type: "function",
        visibility: funcMatch[1] ? "public" : "private",
        modifiers,
        line: lineNumber,
      };
    }

    const arrowMatch = line.match(
      /^(export\s+)?const\s+(\w+)\s*=\s*(\([^)]*\)\s*=>|[^=]*=>)/
    );
    if (arrowMatch) {
      const modifiers: Modifier[] = [];
      if (arrowMatch[1]) {
        modifiers.push("export");
      }
      return {
        name: arrowMatch[2],
        type: "function",
        visibility: arrowMatch[1] ? "public" : "private",
        modifiers,
        line: lineNumber,
      };
    }

    return null;
  }

  private extractVisibilityAndModifiersFromLine(line: string): {
    visibility: Visibility;
    modifiers: Modifier[];
  } {
    const trimmed = line.trim();
    const modifiers: Modifier[] = [];
    let visibility: Visibility = "public";

    if (trimmed.includes("private ")) {
      visibility = "private";
    } else if (trimmed.includes("protected ")) {
      visibility = "protected";
    }

    if (trimmed.includes("static ")) {
      modifiers.push("static");
    }
    if (trimmed.includes("readonly ")) {
      modifiers.push("readonly");
    }
    if (trimmed.includes("abstract ")) {
      modifiers.push("abstract");
    }
    if (trimmed.includes("async ")) {
      modifiers.push("async");
    }
    if (trimmed.includes("export ")) {
      modifiers.push("export");
    }
    if (trimmed.includes("export default ")) {
      modifiers.push("default");
    }

    return { visibility, modifiers };
  }
}
