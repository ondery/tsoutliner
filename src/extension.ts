import * as vscode from "vscode";
import { isSupportedLanguage } from "./languages";
import { SystemFonts } from "./system-fonts";
import { CONFIG_SECTION, EXTENSION_ID } from "./types";
import { OutlineWebviewProvider } from "./webview-provider";

export function activate(context: vscode.ExtensionContext): void {
  const webviewProvider = new OutlineWebviewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      OutlineWebviewProvider.viewType,
      webviewProvider
    )
  );

  const openSettings = (query: string): Thenable<unknown> =>
    vscode.commands.executeCommand(
      "workbench.action.openSettings",
      `@ext:${EXTENSION_ID} ${query}`.trim()
    );

  context.subscriptions.push(
    vscode.commands.registerCommand("tsOutlineEnhancer.refresh", () => {
      void webviewProvider.refresh();
    }),
    vscode.commands.registerCommand("tsOutlineEnhancer.openEmojiSettings", () =>
      openSettings("emojiSettings")
    ),
    vscode.commands.registerCommand("tsOutlineEnhancer.openIconSettings", () =>
      openSettings("iconType")
    ),
    vscode.commands.registerCommand("tsOutlineEnhancer.openFontSettings", () =>
      openSettings("font")
    ),
    vscode.commands.registerCommand(
      "tsOutlineEnhancer.openIconAppearanceSettings",
      () => openSettings("icon")
    ),
    vscode.commands.registerCommand("tsOutlineEnhancer.openAllSettings", () =>
      openSettings("")
    ),
    vscode.commands.registerCommand(
      "tsOutlineEnhancer.sortByPosition",
      () => {
        webviewProvider.setSortMode("position");
      }
    ),
    vscode.commands.registerCommand("tsOutlineEnhancer.sortByName", () => {
      webviewProvider.setSortMode("name");
    }),
    vscode.commands.registerCommand("tsOutlineEnhancer.sortByCategory", () => {
      webviewProvider.setSortMode("category");
    }),
    vscode.commands.registerCommand(
      "tsOutlineEnhancer.selectFont",
      async () => {
        await selectFontFamily(webviewProvider);
      }
    )
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(CONFIG_SECTION)) {
        void webviewProvider.refresh();
      }
    }),
    vscode.window.onDidChangeActiveTextEditor(() => {
      void webviewProvider.refresh();
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      const activeEditor = vscode.window.activeTextEditor;
      if (
        activeEditor &&
        event.document === activeEditor.document &&
        isSupportedLanguage(event.document.languageId)
      ) {
        webviewProvider.scheduleRefresh(500);
      }
    }),
    vscode.window.onDidChangeTextEditorSelection((event) => {
      const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
      if (!config.get<boolean>("autoSelectCurrentElement", false)) {
        return;
      }
      if (!isSupportedLanguage(event.textEditor.document.languageId)) {
        return;
      }
      const line = event.selections[0]?.active.line;
      if (typeof line === "number") {
        webviewProvider.selectElementAtLine(line);
      }
    })
  );
}

async function selectFontFamily(
  webviewProvider: OutlineWebviewProvider
): Promise<void> {
  const fontCategories = SystemFonts.getAllAvailableFonts();
  const currentFont = vscode.workspace
    .getConfiguration(CONFIG_SECTION)
    .get<string>("fontFamily", "inherit");

  type FontPickItem = vscode.QuickPickItem & { fontName?: string };
  const fontItems: FontPickItem[] = [];

  for (const [categoryName, fonts] of Object.entries(fontCategories)) {
    if (categoryName !== "inherit") {
      fontItems.push({
        label: categoryName,
        kind: vscode.QuickPickItemKind.Separator,
      });
    }

    for (const fullFontDeclaration of fonts) {
      const fontName = fullFontDeclaration
        .split(",")[0]
        .replace(/['"]/g, "")
        .trim();

      let description = "";
      let icon = "$(symbol-text)";
      if (fontName === "inherit") {
        icon = "$(symbol-property)";
        description = "Use VS Code editor font";
      } else if (fullFontDeclaration === currentFont) {
        icon = "$(check)";
        description = "Currently selected";
      }

      fontItems.push({
        label: `${icon} ${fontName}`,
        description,
        detail:
          fullFontDeclaration !== fontName ? fullFontDeclaration : undefined,
        fontName: fullFontDeclaration,
      });
    }
  }

  const selected = await vscode.window.showQuickPick(fontItems, {
    placeHolder: "Select a font family for TS Outliner",
    matchOnDescription: true,
    matchOnDetail: true,
    title: "TS Outliner — Font Family",
  });

  if (!selected?.fontName) {
    return;
  }

  const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
  await config.update(
    "fontFamily",
    selected.fontName,
    vscode.ConfigurationTarget.Global
  );
  await webviewProvider.refresh();
}

export function deactivate(): void {
  // Nothing to clean up
}
