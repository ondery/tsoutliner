# TS Outliner

Enhanced outline view for **TypeScript**, **JavaScript**, **JSX**, **TSX**, **Markdown**, and **JSON** in Visual Studio Code.

Uses VS Code’s built-in document symbol providers for accurate structure, then adds customizable icons, fonts, sorting, and one-click navigation in a dedicated Activity Bar panel.

![TS Outliner icon](https://raw.githubusercontent.com/ondery/tsoutliner/master/media/icon.png)

## Features

- **Multi-language outline** — TypeScript, JavaScript, JSX, TSX, Markdown headings, and JSON trees
- **LSP-backed symbols** — Uses `executeDocumentSymbolProvider` with smart text fallbacks
- **Visibility & modifiers** — Public / private / protected, static, async, export, and more (code languages)
- **Icon styles** — Colorful Font Awesome by default; Lucide modern icons, emoji, or none
- **Fuzzy search** — Filter the outline (including nested symbols) with Fuse.js
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
| **TS Outliner: Open Font Awesome Settings** | Customize Font Awesome outline icons |
| **TS Outliner: Open Font Awesome Color Settings** | Customize Font Awesome icon colors |
| **TS Outliner: Open Modern Icon Settings** | Customize Lucide outline icons |
| **TS Outliner: Open Modern Icon Color Settings** | Customize Lucide icon colors |
| **TS Outliner: Open Toolbar Icon Settings** | Customize toolbar action icons |

## Settings

All settings live under `tsOutlineEnhancer.*`. Notable options:

| Setting | Default | Description |
|---------|---------|-------------|
| `tsOutlineEnhancer.iconType` | `fontawesome` | `fontawesome`, `modern`, `emoji`, or `none` |
| `tsOutlineEnhancer.fontAwesomeSettings` | (object) | Per-symbol Font Awesome classes |
| `tsOutlineEnhancer.fontAwesomeColors` | (object) | Per-symbol colors for Font Awesome icons |
| `tsOutlineEnhancer.modernIconSettings` | (object) | Lucide icon IDs per symbol (`lucide:box`, …) |
| `tsOutlineEnhancer.modernIconColors` | (object) | Per-symbol colors for modern icons (`#F59E0B`, …) |
| `tsOutlineEnhancer.toolbarIconSettings` | (object) | Lucide icon IDs for toolbar actions |
| `tsOutlineEnhancer.fontFamily` | Consolas… | Outline panel font |
| `tsOutlineEnhancer.fontSize` | `13` | Font size (px) |
| `tsOutlineEnhancer.sortMode` | `position` | Default sort mode |
| `tsOutlineEnhancer.emojiSettings` | (object) | Per-symbol / visibility emoji map |
| `tsOutlineEnhancer.autoSelectCurrentElement` | `false` | Sync outline selection with caret |
| `tsOutlineEnhancer.showIconsInLabel` | `true` | Show type / visibility icons |
| `tsOutlineEnhancer.showVisibilityInLabel` | `false` | Append `[public]` etc. to labels |

Open **Settings → Extensions → TS Outliner**, or run **TS Outliner: Open Settings**.

### Font Awesome (default)

Outline symbols use **Font Awesome** icons with **per-symbol colors** by default. Icons load from the bundled Font Awesome Free assets under `media/fontawesome` (no CDN, CSP-safe). Override icons and colors independently:

```json
{
  "tsOutlineEnhancer.iconType": "fontawesome",
  "tsOutlineEnhancer.fontAwesomeSettings": {
    "class": "fas fa-cube",
    "method": "fas fa-cog",
    "private": "fas fa-lock"
  },
  "tsOutlineEnhancer.fontAwesomeColors": {
    "class": "#F59E0B",
    "method": "#C084FC",
    "private": "#EF4444"
  }
}
```

See `examples/font-awesome-examples.json` for ready-made sets.

Font family is configured under **Settings → Font Family** (or **TS Outliner: Select Font Family** / **Open Font Settings**).

### Modern icons

Set `iconType` to `modern` for Lucide line icons (also supports per-symbol colors):

```json
{
  "tsOutlineEnhancer.iconType": "modern",
  "tsOutlineEnhancer.modernIconSettings": {
    "class": "lucide:box",
    "method": "lucide:cog",
    "private": "lucide:lock"
  },
  "tsOutlineEnhancer.modernIconColors": {
    "class": "#F59E0B",
    "method": "#C084FC",
    "private": "#EF4444"
  },
  "tsOutlineEnhancer.toolbarIconSettings": {
    "refresh": "lucide:refresh-cw",
    "collapseAll": "lucide:fold-vertical"
  }
}
```

See `examples/modern-icons-examples.json` for ready-made sets. To add icons to the catalog: drop SVGs into `media/icons/`, then run `npm run icons:catalog`.

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
  icons/                Lucide catalog, defaults, resolve helpers
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
