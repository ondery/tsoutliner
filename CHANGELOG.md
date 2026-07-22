# Changelog

All notable changes to **TS Outliner** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Modern Lucide icon set** as the default (`iconType: modern`) — theme-aware line icons for toolbar and outline symbols
- `modernIconSettings` and `toolbarIconSettings` for per-action Iconify IDs (`lucide:name`)
- Bundled icon catalog under `media/icons/` with `npm run icons:catalog` regeneration
- Commands: **Open Modern Icon Settings**, **Open Toolbar Icon Settings**

### Changed

- Toolbar uses ghost buttons (no solid primary fill) that respect dark/light themes
- Outline chevron and toolbar actions use SVG icons instead of emoji

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
