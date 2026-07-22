# Changelog

All notable changes to **TS Outliner** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.3.1] - 2026-07-22

### Fixed

- Fuzzy search results are ordered by **relevance weight** (Fuse.js score) at each tree level
- While filtering, the sort control shows a **Relevance** option (search icon) and a 1px accent border; both are removed when the filter is cleared

## [0.3.0] - 2026-07-22

### Added

- **Editor outline panel** — minimap-style outline beside the active editor (toggle via editor title button or **Toggle Editor Outline**)
- Settings: `editorOutlineEnabled`, `editorOutlineWidth` (160–600px)
- **CSS / SCSS / Less** language support (document symbols + fallback selector/at-rule parser)
- Fuzzy outline search (Fuse.js) across all symbols and nested children

### Changed

- Tooltips use a viewport-aware floating bubble so they stay fully visible in narrow panels
- Unified tree styling for all languages (removed visibility-colored left borders on TS/JS nodes)
- Font Awesome remains the default colorful icon set

## [0.2.0] - 2026-07-22

### Added

- **Outline search** — fuzzy filter box (Fuse.js) replaces the OUTLINE header; searches all symbols and nested children, keeps ancestor context, and auto-expands matches
- **Font Awesome** as the default icon set (`iconType: fontawesome`) with colorful per-symbol defaults
- `fontAwesomeColors` for per-symbol Font Awesome colors (hex / named / CSS var), with color picker in Settings
- **Modern Lucide icon set** (`iconType: modern`) — colorful line icons for outline symbols
- `modernIconSettings` and `toolbarIconSettings` for per-action Iconify IDs (`lucide:name`)
- `modernIconColors` for per-symbol Lucide icon colors
- Bundled icon catalog under `media/icons/` with `npm run icons:catalog` regeneration
- Commands: **Open Font Awesome Settings**, **Open Font Awesome Color Settings**, **Open Modern Icon Settings**, **Open Modern Icon Color Settings**, **Open Toolbar Icon Settings**

### Changed

- Toolbar uses ghost buttons (no solid primary fill) that respect dark/light themes
- Outline chevron and toolbar actions use SVG icons instead of emoji
- Font family is configured only via Settings / command palette (Font button removed from toolbar)

## [0.1.0] - 2026-07-21

### Added

- Support for **JavaScript**, **JSX**, **TSX**, **Markdown**, and **JSON**/**JSONC** alongside TypeScript
- Shared language registry and document-symbol based outline parser
- Markdown heading fallback parser with nested hierarchy
- JSON/JSONC tree fallback parser (objects, arrays, keys)
- Expanded symbol kinds (variables, constants, enums, modules, namespaces, headings, keys, …)
- Cursor sync via `autoSelectCurrentElement`
- Bundled Font Awesome assets (CSP-safe, no CDN)
- Marketplace metadata: publisher, icon, keywords, gallery banner
- Proper TypeScript `src/` tree, `tsconfig.json`, and VS Code launch/tasks

### Changed

- Renamed package to `tsoutliner` (extension id: `ondery.tsoutliner`)
- Unified all commands under the `tsOutlineEnhancer.*` prefix
- Replaced “TypeScript-only” UI copy with language-agnostic messaging
- Professional English README and project docs for public release

### Fixed

- Command IDs that did not match `package.json` contributions
- Settings deep-links that pointed at `undefined_publisher`
- Missing selection listener for auto-select

## [0.0.5] - 2025

- Pre-release builds with TypeScript/TSX outline webview, emoji/Font Awesome icons, and sorting
