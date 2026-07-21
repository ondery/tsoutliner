# Contributing

Thanks for your interest in **TS Outliner**.

## Development

1. Clone the repository
2. Run `npm install`
3. Run `npm run compile` (or `npm run watch`)
4. Press **F5** to open an Extension Development Host
5. Open a `.ts`, `.tsx`, `.js`, `.jsx`, `.md`, or `.json` file and use the **TS Outliner** Activity Bar view

## Guidelines

- Keep all user-facing text in **English**
- Prefer VS Code document symbols over regex; use fallbacks only when necessary
- Add new languages via `src/languages.ts` and extend symbol mapping in `src/outline-parser.ts`
- Run `npm run lint` before opening a pull request

## Reporting issues

Use [GitHub Issues](https://github.com/ondery/tsoutliner/issues) with:

- VS Code / Cursor version
- Extension version
- Language / file type
- Steps to reproduce
