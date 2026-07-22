import * as vscode from "vscode";
import { isSupportedLanguage } from "./languages";
import { OutlineParser } from "./outline-parser";
import { OutlineSorter } from "./outline-sorter";
import { CONFIG_SECTION, OutlineNode, SortMode } from "./types";
import { WebViewTemplateManager } from "./webview-template";

/**
 * Activity Bar webview that renders the enhanced outline.
 */
export class OutlineWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "tsOutlineEnhancer.webview";

  private _view?: vscode.WebviewView;
  private nodes: OutlineNode[] = [];
  private sortMode: SortMode = "position";
  private readonly parser = new OutlineParser();
  private readonly templateManager = new WebViewTemplateManager();
  private refreshTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly _extensionUri: vscode.Uri) {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    this.sortMode = config.get<SortMode>("sortMode", "position");
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri,
        vscode.Uri.joinPath(this._extensionUri, "media"),
      ],
    };

    webviewView.webview.html = this.templateManager.generateHTML(
      webviewView.webview,
      this._extensionUri
    );

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "goToLine":
          this.goToLine(message.line);
          break;
        case "selectBlock":
          await this.selectBlock(
            message.line,
            message.name,
            message.nodeType || message.type
          );
          break;
        case "sortBy":
          this.setSortMode(message.mode);
          break;
        case "refresh":
          await this.refresh();
          break;
        default:
          console.error(`Unknown message type: ${message.type}`);
      }
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        void this.refresh();
      }
    });

    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.nodes = await this.parser.parseActiveFile();
    this.applySorting();
    this.updateWebview();
  }

  setSortMode(mode: SortMode): void {
    this.sortMode = mode;
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    void config.update("sortMode", mode, vscode.ConfigurationTarget.Global);
    this.applySorting();
    this.updateWebview();
  }

  scheduleRefresh(delayMs = 400): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = setTimeout(() => {
      void this.refresh();
    }, delayMs);
  }

  selectElementAtLine(line: number): void {
    if (this._view?.visible) {
      this._view.webview.postMessage({
        type: "selectElementAtLine",
        line,
      });
    }
  }

  private updateWebview(): void {
    if (!this._view?.visible) {
      return;
    }

    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const editor = vscode.window.activeTextEditor;
    const languageId = editor?.document.languageId;

    this._view.webview.postMessage({
      type: "updateOutline",
      nodes: this.nodes,
      sortMode: this.sortMode,
      languageId,
      settings: {
        emojiSettings: config.get("emojiSettings", {}),
        fontAwesomeSettings: config.get("fontAwesomeSettings", {}),
        fontAwesomeColors: config.get("fontAwesomeColors", {}),
        modernIconSettings: config.get("modernIconSettings", {}),
        modernIconColors: config.get("modernIconColors", {}),
        toolbarIconSettings: config.get("toolbarIconSettings", {}),
        iconType: config.get("iconType", "fontawesome"),
        fontFamily: config.get(
          "fontFamily",
          "Consolas, 'Courier New', monospace"
        ),
        fontSize: config.get("fontSize", 13),
        lineHeight: config.get("lineHeight", 1.2),
        iconSize: config.get("iconSize", 16),
        iconSpacing: config.get("iconSpacing", 4),
        iconToTextSpacing: config.get("iconToTextSpacing", 6),
        tooltipFontSize: config.get("tooltipFontSize", 11),
        showTooltipPrefixes: config.get("showTooltipPrefixes", false),
        showIconsInLabel: config.get("showIconsInLabel", true),
        showVisibilityInLabel: config.get("showVisibilityInLabel", false),
        autoSelectCurrentElement: config.get("autoSelectCurrentElement", false),
        autoRevealCurrentElement: config.get(
          "autoRevealCurrentElement",
          false
        ),
      },
    });
  }

  private goToLine(lineNumber: number): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    const position = new vscode.Position(lineNumber, 0);
    const range = new vscode.Range(position, position);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
  }

  private async selectBlock(
    line: number,
    name: string,
    type: string
  ): Promise<void> {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor found");
      return;
    }

    if (!isSupportedLanguage(editor.document.languageId)) {
      const supported = vscode.window.visibleTextEditors.find((e) =>
        isSupportedLanguage(e.document.languageId)
      );
      if (!supported) {
        vscode.window.showErrorMessage(
          "No supported file is open (TypeScript, JavaScript, JSX, TSX, Markdown, or JSON)"
        );
        return;
      }
      editor = await vscode.window.showTextDocument(supported.document);
      return this.selectBlock(line, name, type);
    }

    try {
      const symbols = (await vscode.commands.executeCommand(
        "vscode.executeDocumentSymbolProvider",
        editor.document.uri
      )) as vscode.DocumentSymbol[] | undefined;

      if (!symbols || symbols.length === 0) {
        this.fallbackSelection(line, editor.document);
        return;
      }

      const targetSymbol = this.findSymbolByLineAndName(
        symbols,
        line,
        name,
        type
      );
      if (targetSymbol) {
        const selection = new vscode.Selection(
          targetSymbol.range.start,
          targetSymbol.range.end
        );
        editor.selection = selection;
        editor.revealRange(selection, vscode.TextEditorRevealType.InCenter);
      } else {
        this.fallbackSelection(line, editor.document);
      }
    } catch (error) {
      console.error("Error selecting symbol range:", error);
      this.fallbackSelection(line, editor.document);
    }
  }

  private findSymbolByLineAndName(
    symbols: vscode.DocumentSymbol[],
    targetLine: number,
    targetName: string,
    targetType: string
  ): vscode.DocumentSymbol | null {
    for (const symbol of symbols) {
      const symbolLine = symbol.range.start.line;

      if (
        targetType === "constructor" &&
        symbol.kind === vscode.SymbolKind.Constructor &&
        Math.abs(symbolLine - targetLine) <= 1
      ) {
        return symbol;
      }

      if (
        symbol.name === targetName &&
        Math.abs(symbolLine - targetLine) <= 1
      ) {
        return symbol;
      }

      if (symbol.children?.length) {
        const child = this.findSymbolByLineAndName(
          symbol.children,
          targetLine,
          targetName,
          targetType
        );
        if (child) {
          return child;
        }
      }
    }
    return null;
  }

  private fallbackSelection(
    line: number,
    document: vscode.TextDocument
  ): void {
    const startPos = new vscode.Position(line, 0);
    const endPos = new vscode.Position(line, document.lineAt(line).text.length);
    const selection = new vscode.Selection(startPos, endPos);
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      editor.selection = selection;
      editor.revealRange(selection, vscode.TextEditorRevealType.InCenter);
    }
  }

  private applySorting(): void {
    this.nodes = OutlineSorter.sortNodes(this.nodes, this.sortMode);
  }
}

/** @deprecated Use OutlineWebviewProvider */
export const TypeScriptWebviewProvider = OutlineWebviewProvider;
