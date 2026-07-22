import * as vscode from "vscode";
import { isSupportedLanguage } from "./languages";
import { OutlineParser } from "./outline-parser";
import { OutlineSorter } from "./outline-sorter";
import { CONFIG_SECTION, OutlineNode, SortMode } from "./types";
import { WebViewTemplateManager } from "./webview-template";

const EDITOR_OUTLINE_VIEW_TYPE = "tsOutlineEnhancer.editorOutline";
const EDITOR_OUTLINE_CONTEXT = "tsOutlineEnhancer.editorOutlineOpen";

/**
 * Activity Bar + optional editor-adjacent outline webviews.
 */
export class OutlineWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "tsOutlineEnhancer.webview";

  private _view?: vscode.WebviewView;
  private editorPanel?: vscode.WebviewPanel;
  private nodes: OutlineNode[] = [];
  private sortMode: SortMode = "position";
  private readonly parser = new OutlineParser();
  private readonly templateManager = new WebViewTemplateManager();
  private refreshTimer: ReturnType<typeof setTimeout> | undefined;
  private lastCodeEditor?: vscode.TextEditor;
  private restoringLayout = false;

  constructor(private readonly _extensionUri: vscode.Uri) {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    this.sortMode = config.get<SortMode>("sortMode", "position");
    void vscode.commands.executeCommand(
      "setContext",
      EDITOR_OUTLINE_CONTEXT,
      false
    );
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

    this.attachWebviewMessages(webviewView.webview);

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        void this.refresh();
      }
    });

    void this.refresh();
  }

  trackCodeEditor(editor: vscode.TextEditor | undefined): void {
    if (editor && isSupportedLanguage(editor.document.languageId)) {
      this.lastCodeEditor = editor;
    }
  }

  async refresh(): Promise<void> {
    this.nodes = await this.parser.parseActiveFile();
    if (
      this.nodes.length === 0 &&
      this.lastCodeEditor &&
      isSupportedLanguage(this.lastCodeEditor.document.languageId)
    ) {
      // Active editor may be the outline panel; parse last code editor document
      this.nodes = await this.parser.parseDocument(
        this.lastCodeEditor.document
      );
    }
    this.applySorting();
    this.updateAllWebviews();
  }

  setSortMode(mode: SortMode): void {
    this.sortMode = mode;
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    void config.update("sortMode", mode, vscode.ConfigurationTarget.Global);
    this.applySorting();
    this.updateAllWebviews();
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
    this.postToWebviews({
      type: "selectElementAtLine",
      line,
    });
  }

  isEditorOutlineOpen(): boolean {
    return !!this.editorPanel;
  }

  async toggleEditorOutline(): Promise<void> {
    if (this.editorPanel) {
      await this.hideEditorOutline();
    } else {
      await this.showEditorOutline();
    }
  }

  async showEditorOutline(): Promise<void> {
    if (this.editorPanel) {
      this.editorPanel.reveal(vscode.ViewColumn.Beside, true);
      await this.applyEditorOutlineLayout();
      await this.refresh();
      return;
    }

    const editor =
      vscode.window.activeTextEditor &&
      isSupportedLanguage(vscode.window.activeTextEditor.document.languageId)
        ? vscode.window.activeTextEditor
        : this.lastCodeEditor;

    if (editor) {
      this.lastCodeEditor = editor;
    }

    await this.applyEditorOutlineLayout();

    this.editorPanel = vscode.window.createWebviewPanel(
      EDITOR_OUTLINE_VIEW_TYPE,
      "Outline",
      {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          this._extensionUri,
          vscode.Uri.joinPath(this._extensionUri, "media"),
        ],
      }
    );

    this.editorPanel.iconPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "activitybar.svg"
    );

    this.editorPanel.webview.html = this.templateManager.generateHTML(
      this.editorPanel.webview,
      this._extensionUri
    );

    this.attachWebviewMessages(this.editorPanel.webview);

    this.editorPanel.onDidDispose(() => {
      this.editorPanel = undefined;
      void vscode.commands.executeCommand(
        "setContext",
        EDITOR_OUTLINE_CONTEXT,
        false
      );
      void this.restoreEditorLayout();
      void this.persistEditorOutlineEnabled(false);
    });

    void vscode.commands.executeCommand(
      "setContext",
      EDITOR_OUTLINE_CONTEXT,
      true
    );
    await this.persistEditorOutlineEnabled(true);
    await this.refresh();
  }

  async hideEditorOutline(): Promise<void> {
    this.editorPanel?.dispose();
  }

  async syncEditorOutlineFromConfig(): Promise<void> {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const enabled = config.get<boolean>("editorOutlineEnabled", false);
    if (enabled && !this.editorPanel) {
      await this.showEditorOutline();
    } else if (!enabled && this.editorPanel) {
      await this.hideEditorOutline();
    } else if (enabled && this.editorPanel) {
      await this.applyEditorOutlineLayout();
    }
  }

  private async persistEditorOutlineEnabled(enabled: boolean): Promise<void> {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    await config.update(
      "editorOutlineEnabled",
      enabled,
      vscode.ConfigurationTarget.Global
    );
  }

  private async applyEditorOutlineLayout(): Promise<void> {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    const widthPx = config.get<number>("editorOutlineWidth", 280);
    const clamped = Math.min(600, Math.max(160, widthPx));
    // Approximate editor area; clamp outline share between 12% and 45%
    const ratio = Math.min(0.45, Math.max(0.12, clamped / (clamped + 900)));

    this.restoringLayout = true;
    try {
      await vscode.commands.executeCommand("vscode.setEditorLayout", {
        orientation: 0,
        groups: [{ size: 1 - ratio }, { size: ratio }],
      });
    } catch (error) {
      console.error("Failed to set editor outline layout:", error);
    } finally {
      this.restoringLayout = false;
    }
  }

  private async restoreEditorLayout(): Promise<void> {
    if (this.restoringLayout) {
      return;
    }
    this.restoringLayout = true;
    try {
      await vscode.commands.executeCommand("vscode.setEditorLayout", {
        orientation: 0,
        groups: [{}],
      });
    } catch (error) {
      console.error("Failed to restore editor layout:", error);
    } finally {
      this.restoringLayout = false;
    }
  }

  private attachWebviewMessages(webview: vscode.Webview): void {
    webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "goToLine":
          await this.goToLine(message.line);
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
        case "toggleEditorOutline":
          await this.toggleEditorOutline();
          break;
        default:
          console.error(`Unknown message type: ${message.type}`);
      }
    });
  }

  private getSettingsPayload(): Record<string, unknown> {
    const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
    return {
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
      autoRevealCurrentElement: config.get("autoRevealCurrentElement", false),
    };
  }

  private updateAllWebviews(): void {
    const editor =
      vscode.window.activeTextEditor &&
      isSupportedLanguage(vscode.window.activeTextEditor.document.languageId)
        ? vscode.window.activeTextEditor
        : this.lastCodeEditor;
    const languageId = editor?.document.languageId;

    const payload = {
      type: "updateOutline",
      nodes: this.nodes,
      sortMode: this.sortMode,
      languageId,
      settings: this.getSettingsPayload(),
    };

    if (this._view?.visible) {
      this._view.webview.postMessage(payload);
    }
    if (this.editorPanel) {
      this.editorPanel.webview.postMessage(payload);
    }
  }

  private postToWebviews(message: Record<string, unknown>): void {
    if (this._view?.visible) {
      this._view.webview.postMessage(message);
    }
    if (this.editorPanel) {
      this.editorPanel.webview.postMessage(message);
    }
  }

  private async focusCodeEditor(): Promise<vscode.TextEditor | undefined> {
    let editor =
      vscode.window.activeTextEditor &&
      isSupportedLanguage(vscode.window.activeTextEditor.document.languageId)
        ? vscode.window.activeTextEditor
        : this.lastCodeEditor;

    if (!editor) {
      editor = vscode.window.visibleTextEditors.find((e) =>
        isSupportedLanguage(e.document.languageId)
      );
    }

    if (!editor) {
      return undefined;
    }

    this.lastCodeEditor = editor;
    return vscode.window.showTextDocument(editor.document, {
      viewColumn: editor.viewColumn,
      preserveFocus: false,
      preview: false,
    });
  }

  private async goToLine(lineNumber: number): Promise<void> {
    const editor = await this.focusCodeEditor();
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
    let editor = await this.focusCodeEditor();
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
          "No supported file is open (TypeScript, JavaScript, JSX, TSX, CSS, Markdown, or JSON)"
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
        this.fallbackSelection(line, editor);
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
        this.fallbackSelection(line, editor);
      }
    } catch (error) {
      console.error("Error selecting symbol range:", error);
      this.fallbackSelection(line, editor);
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

  private fallbackSelection(line: number, editor: vscode.TextEditor): void {
    const document = editor.document;
    const startPos = new vscode.Position(line, 0);
    const endPos = new vscode.Position(line, document.lineAt(line).text.length);
    const selection = new vscode.Selection(startPos, endPos);
    editor.selection = selection;
    editor.revealRange(selection, vscode.TextEditorRevealType.InCenter);
  }

  private applySorting(): void {
    this.nodes = OutlineSorter.sortNodes(this.nodes, this.sortMode);
  }
}

/** @deprecated Use OutlineWebviewProvider */
export const TypeScriptWebviewProvider = OutlineWebviewProvider;
