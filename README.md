# TS Outliner

Enhanced outline view for **TypeScript**, **JavaScript**, **JSX**, **TSX**, **Markdown**, and **JSON** in Visual Studio Code.

Uses VS Code’s built-in document symbol providers for accurate structure, then adds customizable icons, fonts, sorting, and one-click navigation in a dedicated Activity Bar panel.

![TS Outliner icon](https://raw.githubusercontent.com/ondery/tsoutliner/master/media/icon.png)

## Features

- **Multi-language outline** — TypeScript, JavaScript, JSX, TSX, Markdown headings, and JSON trees
- **LSP-backed symbols** — Uses `executeDocumentSymbolProvider` with smart text fallbacks
- **Visibility & modifiers** — Public / private / protected, static, async, export, and more (code languages)
- **Icon styles** — Emoji, Font Awesome, or none
- **Typography controls** — Font family picker, size, and line height
- **Sorting** — By position, name, or category
- **Navigation** — Click to jump; double-click to select the full symbol range
- **Cursor sync** — Optional auto-select of the outline item under the caret

## Supported languages

| Language   | VS Code language ID   | Outline content                          |
|------------|-----------------------|------------------------------------------|
| TypeScript | `typescript`          | Classes, interfaces, methods, functions… |
| TSX        | `typescriptreact`     | Same as TypeScript + React components    |
| JavaScript | `javascript`          | Classes, functions, variables…           |
| JSX        | `javascriptreact`     | Same as JavaScript + React components    |
| Markdown   | `markdown`            | Nested headings (`#` … `######`)         |
| JSON       | `json`                | Nested objects, arrays, and keys         |
| JSONC      | `jsonc`               | Same as JSON (comments allowed)          |

## Getting started

1. Install the extension (Marketplace or `.vsix`).
2. Open a supported file.
3. Open the **TS Outliner** icon in the Activity Bar.
4. Click an item to navigate; double-click to select the whole block.

### Development

```bash
npm install
npm run compile
```

Press **F5** in VS Code/Cursor to launch an Extension Development Host.

Sample files live in [`examples/`](examples/).

## Commands

| Command | Description |
|---------|-------------|
| **TS Outliner: Refresh Outline** | Rebuild the outline for the active file |
| **TS Outliner: Select Font Family** | Pick a font for the outline panel |
| **TS Outliner: Sort By: Position / Name / Category** | Change sort order |
| **TS Outliner: Open Settings** | Open all extension settings |
| **TS Outliner: Open Emoji / Icon / Font Settings** | Jump to specific setting groups |

## Settings

All settings live under `tsOutlineEnhancer.*`. Notable options:

| Setting | Default | Description |
|---------|---------|-------------|
| `tsOutlineEnhancer.iconType` | `emoji` | `emoji`, `fontawesome`, or `none` |
| `tsOutlineEnhancer.fontFamily` | Consolas… | Outline panel font |
| `tsOutlineEnhancer.fontSize` | `13` | Font size (px) |
| `tsOutlineEnhancer.sortMode` | `position` | Default sort mode |
| `tsOutlineEnhancer.emojiSettings` | (object) | Per-symbol / visibility emoji map |
| `tsOutlineEnhancer.fontAwesomeSettings` | (object) | Per-symbol Font Awesome classes |
| `tsOutlineEnhancer.autoSelectCurrentElement` | `false` | Sync outline selection with caret |
| `tsOutlineEnhancer.showIconsInLabel` | `true` | Show type / visibility icons |
| `tsOutlineEnhancer.showVisibilityInLabel` | `false` | Append `[public]` etc. to labels |

Open **Settings → Extensions → TS Outliner**, or run **TS Outliner: Open Settings**.

### Font Awesome

When `iconType` is `fontawesome`, icons load from the bundled Font Awesome Free assets under `media/fontawesome` (no CDN, CSP-safe).

## Architecture

```
src/
  extension.ts          Activation, commands, editor events
  outline-parser.ts     Document symbols → outline tree (+ fallbacks)
  languages.ts          Supported language IDs
  webview-provider.ts   Activity Bar webview coordination
  webview-template.ts   Panel HTML / CSS / client script
  outline-sorter.ts     Position / name / category sorting
  system-fonts.ts       Cross-platform font discovery
  types.ts              Shared types
```

## Packaging

```bash
npm run compile
npm run package
```

Requires a valid `publisher` in `package.json` (already set to `ondery`).

## License

MIT © ondery — see [LICENSE.txt](LICENSE.txt).

## Links

- Repository: [github.com/ondery/tsoutliner](https://github.com/ondery/tsoutliner)
- Issues: [github.com/ondery/tsoutliner/issues](https://github.com/ondery/tsoutliner/issues)
