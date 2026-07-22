import * as vscode from "vscode";
import {
  serializeDefaults,
  serializeIconCatalog,
} from "./icons";

/**
 * WebView HTML şablonlarını ve styling'ini yöneten modül
 */
export class WebViewTemplateManager {
    /**
     * Ana HTML içeriğini oluşturur
     */
    generateHTML(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        const fontAwesomeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(extensionUri, "media", "fontawesome", "css", "all.min.css")
        );
        const fuseUri = webview.asWebviewUri(
            vscode.Uri.joinPath(extensionUri, "media", "lib", "fuse.min.js")
        );
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TS Outliner</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; script-src 'nonce-${nonce}' ${webview.cspSource};">
    <link rel="stylesheet" href="${fontAwesomeUri}">
    <style>
        ${this.getStyles()}
    </style>
</head>
<body>
    <div class="sidebar">
        ${this.getToolbarHTML()}
        ${this.getContentHTML()}
    </div>
    
    <script nonce="${nonce}" src="${fuseUri}"></script>
    <script nonce="${nonce}">
        ${this.getJavaScript()}
    </script>
</body>
</html>`;
    }
    /**
     * CSS stilleri
     */
    getStyles() {
        return `
        /* Reset and Variables */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        :root {
            --spacing-xs: 0.25rem;
            --spacing-sm: 0.5rem;
            --spacing-md: 0.75rem;
            --spacing-lg: 1rem;
            --border-radius: 0.25rem;
            --transition: all 0.15s ease-in-out;
        }
        
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            height: 100vh;
            overflow: hidden;
        }

        /* Custom font family and sizing - will be updated via JavaScript */
        .outline-container {
            font-family: var(--outline-font-family, var(--vscode-font-family));
            font-size: var(--outline-font-size, var(--vscode-font-size));
            line-height: var(--outline-line-height, 1.2);
        }

        /* Icon sizing and spacing variables */
        :root {
            --icon-size: 16px;
            --icon-spacing: 4px;
            --icon-to-text-spacing: 6px;
            --tooltip-font-size: 11px;
        }

        /* Override specific element font sizes to use relative units */
        .node-name {
            flex: 1;
            font-size: 1em; /* Use relative to parent font size */
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .line-number {
            font-size: 0.8em; /* Relative to parent font size */
            color: var(--vscode-descriptionForeground);
            opacity: 0.7;
            margin-left: auto;
        }



        /* Layout Components */
        .sidebar {
            display: flex;
            flex-direction: column;
            height: 100vh;
            width: 100%;
        }

        .toolbar {
            padding: 4px 6px;
            border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border, var(--vscode-panel-border));
            background-color: transparent;
            display: flex;
            align-items: center;
            gap: 2px;
            flex-wrap: wrap;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }

        .toolbar-divider {
            width: 1px;
            height: 16px;
            background: var(--vscode-panel-border);
            margin: 0 4px;
            flex-shrink: 0;
            opacity: 0.7;
        }

        .content {
            flex: 1;
            overflow-y: auto;
            padding: var(--spacing-xs);
        }

        .outline-section {
            margin-bottom: var(--spacing-md);
        }

        .outline-search {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 0 var(--spacing-sm) var(--spacing-xs);
            margin-bottom: var(--spacing-xs);
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .outline-search-input {
            flex: 1;
            min-width: 0;
            height: 24px;
            padding: 2px 8px;
            border: 1px solid var(--vscode-input-border, transparent);
            border-radius: 3px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: 12px;
            outline: none;
        }

        .outline-search-input::placeholder {
            color: var(--vscode-input-placeholderForeground, var(--vscode-descriptionForeground));
        }

        .outline-search-input:focus {
            border-color: var(--vscode-focusBorder);
        }

        .outline-search-input::-webkit-search-cancel-button {
            display: none;
        }

        .outline-search-clear {
            flex-shrink: 0;
            width: 22px;
            height: 22px;
            padding: 0;
            border: none;
            border-radius: 3px;
            background: transparent;
            color: var(--vscode-icon-foreground, var(--vscode-descriptionForeground));
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
            display: none;
            align-items: center;
            justify-content: center;
            opacity: 0.75;
        }

        .outline-search-clear.visible {
            display: inline-flex;
        }

        .outline-search-clear:hover {
            background: var(--vscode-toolbar-hoverBackground);
            opacity: 1;
        }

        /* Toolbar buttons — ghost style, theme-aware (dark/light) */
        .btn {
            padding: 4px 8px;
            border: none;
            border-radius: 4px;
            background: transparent;
            color: var(--vscode-icon-foreground, var(--vscode-foreground));
            cursor: pointer;
            font-size: 11px;
            font-family: inherit;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            transition: background-color 0.12s ease, color 0.12s ease, opacity 0.12s ease;
            white-space: nowrap;
            line-height: 1;
            min-height: 24px;
            opacity: 0.82;
        }

        .btn:hover {
            background: var(--vscode-toolbar-hoverBackground);
            opacity: 1;
        }

        .btn:active {
            background: var(--vscode-toolbar-activeBackground, var(--vscode-toolbar-hoverBackground));
        }

        .btn.active {
            background: var(--vscode-toolbar-activeBackground, var(--vscode-list-hoverBackground));
            color: var(--vscode-foreground);
            opacity: 1;
            box-shadow: inset 0 0 0 1px var(--vscode-focusBorder);
        }

        .btn.active:hover {
            background: var(--vscode-toolbar-hoverBackground);
        }

        .btn:focus-visible {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: 1px;
        }

        .btn-icon-only {
            padding: 4px;
            min-width: 24px;
        }

        .btn-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            flex-shrink: 0;
            color: inherit;
        }

        .btn-icon svg {
            width: 14px;
            height: 14px;
            display: block;
        }

        .btn-label {
            letter-spacing: 0.01em;
        }

        /* Sort icon combobox */
        .sort-combo {
            position: relative;
            display: inline-flex;
            border: 1px solid transparent;
            border-radius: 4px;
        }

        .sort-combo.filter-active {
            border-color: var(--vscode-focusBorder, var(--vscode-charts-blue, #3794ff));
        }

        .sort-combo-trigger {
            padding: 4px 6px;
            gap: 2px;
        }

        .sort-combo-caret {
            width: 10px;
            height: 10px;
            opacity: 0.7;
            transform: rotate(90deg);
        }

        .sort-combo-caret svg {
            width: 10px;
            height: 10px;
        }

        .sort-combo.open .sort-combo-trigger {
            background: var(--vscode-toolbar-hoverBackground);
            opacity: 1;
        }

        .sort-combo.open .sort-combo-caret {
            transform: rotate(-90deg);
        }

        .sort-combo-menu {
            position: absolute;
            top: calc(100% + 4px);
            right: 0;
            min-width: 148px;
            padding: 4px;
            border-radius: 6px;
            border: 1px solid var(--vscode-menu-border, var(--vscode-panel-border));
            background: var(--vscode-menu-background, var(--vscode-dropdown-background, var(--vscode-sideBar-background)));
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
            z-index: 100;
            display: none;
            flex-direction: column;
            gap: 1px;
        }

        .sort-combo.open .sort-combo-menu {
            display: flex;
        }

        .sort-combo-option {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 6px 8px;
            border: none;
            border-radius: 4px;
            background: transparent;
            color: var(--vscode-menu-foreground, var(--vscode-foreground));
            cursor: pointer;
            font-size: 12px;
            font-family: inherit;
            text-align: left;
            line-height: 1.2;
        }

        .sort-combo-option:hover {
            background: var(--vscode-list-hoverBackground);
        }

        .sort-combo-option.active {
            background: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }

        .sort-combo-option .btn-icon {
            color: inherit;
        }

        .sort-combo-option-label {
            flex: 1;
        }

        /* Node Components */
        .node {
            display: block;
            margin-bottom: 1px;
        }

        .node-content {
            display: flex;
            align-items: center;
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--border-radius);
            cursor: pointer;
            transition: var(--transition);
            min-height: 1.5rem;
            gap: var(--icon-to-text-spacing); /* Spacing between icons and text */
            user-select: none;
        }

        .node-content:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .node-content.selected {
            background-color: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
        }

        .node-children {
            margin-left: var(--spacing-lg);
            border-left: 1px solid var(--vscode-tree-indentGuidesStroke);
            padding-left: var(--spacing-sm);
            overflow: visible;
            transition: var(--transition);
        }

        .node-children.collapsed {
            display: none;
        }

        /* Icon Components */
        .chevron {
            width: 0.875rem;
            height: 0.875rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.15s ease-in-out, background-color 0.12s ease;
            font-size: 0.75em;
            color: var(--vscode-icon-foreground, var(--vscode-descriptionForeground));
            border-radius: 3px;
            flex-shrink: 0;
        }

        .chevron svg {
            width: 12px;
            height: 12px;
            display: block;
            pointer-events: none;
        }

        .chevron.expanded {
            transform: rotate(90deg);
        }

        .chevron:hover {
            background-color: var(--vscode-toolbar-hoverBackground);
            color: var(--vscode-foreground);
        }

        .type-icon,
        .fa-icon,
        .svg-icon {
            font-size: var(--icon-size);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: var(--icon-size);
            height: var(--icon-size);
            flex-shrink: 0;
            color: var(--vscode-icon-foreground, var(--vscode-foreground));
        }

        .svg-icon svg,
        .feature-svg-icon svg {
            width: 100%;
            height: 100%;
            display: block;
        }

        .feature-icon,
        .feature-fa-icon,
        .feature-svg-icon {
            font-size: calc(var(--icon-size) * 0.8);
            opacity: 0.85;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: calc(var(--icon-size) * 0.8);
            height: calc(var(--icon-size) * 0.8);
            flex-shrink: 0;
            color: var(--vscode-icon-foreground, var(--vscode-descriptionForeground));
        }

        .feature-fa-icon {
            font-size: calc(var(--icon-size) * 0.7);
        }

        .features {
            display: flex;
            gap: var(--icon-spacing); /* Icons arası boşluk - user setting */
            align-items: center;
        }

        /* Visibility: icons carry meaning — no colored left border (uniform tree for all languages) */
        .visibility-none,
        .visibility-public,
        .visibility-private,
        .visibility-protected {
            border-left: none;
        }

        /* Modifier Styling */
        .modifier-static .node-name { font-weight: 600; }
        .modifier-readonly .node-name { font-style: italic; }
        .modifier-abstract .node-name { opacity: 0.8; }

        /* Empty State */
        .empty-state {
            padding: var(--spacing-lg) var(--spacing-md);
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-style: normal;
            font-size: 0.85em;
            line-height: 1.45;
            opacity: 0.9;
        }

        /* Tooltip — positioned via JS (viewport-aware) */
        .tooltip {
            position: relative;
        }

        #outline-tooltip {
            position: fixed;
            z-index: 10000;
            max-width: min(280px, calc(100vw - 16px));
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--border-radius);
            font-size: var(--tooltip-font-size);
            line-height: 1.3;
            background-color: var(--vscode-editorHoverWidget-background);
            color: var(--vscode-editorHoverWidget-foreground);
            border: 1px solid var(--vscode-editorHoverWidget-border);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
            pointer-events: none;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.12s ease;
            white-space: normal;
            word-break: break-word;
        }

        #outline-tooltip.visible {
            opacity: 1;
            visibility: visible;
        }

        /* Scrollbar */
        .content::-webkit-scrollbar {
            width: 6px;
        }

        .content::-webkit-scrollbar-track {
            background: transparent;
        }

        .content::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-background);
            border-radius: 3px;
        }

        .content::-webkit-scrollbar-thumb:hover {
            background: var(--vscode-scrollbarSlider-hoverBackground);
        }
    `;
    }
    /**
     * Toolbar HTML'ini oluşturur
     */
    getToolbarHTML() {
        return `
        <div class="toolbar">
            <button class="btn" id="refresh-btn" title="Refresh outline">
                <span class="btn-icon" data-toolbar-icon="refresh" aria-hidden="true"></span>
                <span class="btn-label">Refresh</span>
            </button>
            <button class="btn" id="collapse-all-btn" title="Collapse all nodes">
                <span class="btn-icon" data-toolbar-icon="collapseAll" aria-hidden="true"></span>
                <span class="btn-label">Collapse All</span>
            </button>
            <div class="toolbar-divider" role="separator" aria-hidden="true"></div>
            <div class="sort-combo" id="sort-combo">
                <button type="button" class="btn sort-combo-trigger" id="sort-combo-trigger" title="Sort by: Position" aria-haspopup="listbox" aria-expanded="false" aria-controls="sort-combo-menu">
                    <span class="btn-icon" id="sort-combo-icon" data-toolbar-icon="sortPosition" aria-hidden="true"></span>
                    <span class="btn-icon sort-combo-caret" data-toolbar-icon="chevron" aria-hidden="true"></span>
                </button>
                <div class="sort-combo-menu" id="sort-combo-menu" role="listbox" aria-label="Sort mode">
                    <button type="button" class="sort-combo-option" data-sort="position" role="option" title="Sort by position in file">
                        <span class="btn-icon" data-toolbar-icon="sortPosition" aria-hidden="true"></span>
                        <span class="sort-combo-option-label">Position</span>
                    </button>
                    <button type="button" class="sort-combo-option" data-sort="name" role="option" title="Sort alphabetically by name">
                        <span class="btn-icon" data-toolbar-icon="sortName" aria-hidden="true"></span>
                        <span class="sort-combo-option-label">Name</span>
                    </button>
                    <button type="button" class="sort-combo-option" data-sort="category" role="option" title="Sort by element category">
                        <span class="btn-icon" data-toolbar-icon="sortCategory" aria-hidden="true"></span>
                        <span class="sort-combo-option-label">Category</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    }
    /**
     * İçerik HTML'ini oluşturur
     */
    getContentHTML() {
        return `
        <div class="content">
            <div class="outline-section">
                <div class="outline-search">
                    <input
                        type="search"
                        id="outline-search-input"
                        class="outline-search-input"
                        placeholder="Search outline…"
                        aria-label="Search outline"
                        autocomplete="off"
                        spellcheck="false"
                    />
                    <button type="button" id="outline-search-clear" class="outline-search-clear" title="Clear search" aria-label="Clear search">×</button>
                </div>
                <div id="outline-container" class="outline-container">
                    <div class="empty-state">Loading...</div>
                </div>
            </div>
        </div>
        <div id="outline-tooltip" role="tooltip" aria-hidden="true"></div>
    `;
    }
    /**
     * Client-side JavaScript kodunu oluşturur
     */
    getJavaScript() {
        return `
        const ICON_CATALOG = ${serializeIconCatalog()};
        const ICON_DEFAULTS = ${serializeDefaults()};

        function resolveCatalogIcon(iconId) {
            return ICON_CATALOG[iconId] || ICON_CATALOG['lucide:help-circle'] || '';
        }

        function resolveIconId(key, settingsMap, defaultsMap) {
            return (settingsMap && settingsMap[key]) || defaultsMap[key] || 'lucide:help-circle';
        }

        // State Management
        class OutlineState {
            constructor() {
                this.nodes = [];
                this.sortMode = 'position';
                this.selectedNode = null;
                this.collapsedStateKey = 'ts-outliner-collapsed-state';
                this.settings = this.getDefaultSettings();
                this.languageId = '';
                this.searchQuery = '';
            }

            getDefaultSettings() {
                return {
                    emojiSettings: {
                        "public": "🌐",
                        "private": "🔒",
                        "protected": "🛡️",
                        "static": "📌",
                        "readonly": "📖",
                        "abstract": "🎭",
                        "async": "⚡",
                        "export": "📤",
                        "default": "🌟",
                        "constructor": "🏗️",
                        "property": "📝",
                        "method": "⚙️",
                        "function": "🔧",
                        "getter": "📤",
                        "setter": "📥",
                        "class": "📦",
                        "interface": "📋",
                        "heading": "📑",
                        "variable": "💠",
                        "constant": "🔷",
                        "enum": "📚",
                        "enumMember": "▪️",
                        "module": "📁",
                        "namespace": "📂",
                        "typeAlias": "🏷️",
                        "file": "📄",
                        "object": "🧩",
                        "array": "📋",
                        "key": "🔑",
                        "event": "📡",
                        "operator": "➗",
                        "typeParameter": "Ｔ"
                    },
                    fontAwesomeSettings: { ...ICON_DEFAULTS.fontawesome },
                    fontAwesomeColors: { ...ICON_DEFAULTS.colors },
                    modernIconSettings: { ...ICON_DEFAULTS.modern },
                    modernIconColors: { ...ICON_DEFAULTS.colors },
                    toolbarIconSettings: { ...ICON_DEFAULTS.toolbar },
                    iconType: "fontawesome",
                    fontFamily: "Consolas, 'Courier New', monospace",
                    fontSize: 13,
                    lineHeight: 1.2,
                    iconSize: 16,
                    iconSpacing: 4,
                    iconToTextSpacing: 6,
                    tooltipFontSize: 11,
                    showTooltipPrefixes: false,
                    showIconsInLabel: true,
                    showVisibilityInLabel: false,
                    autoSelectCurrentElement: false,
                    autoRevealCurrentElement: false
                };
            }

            setNodes(nodes, languageId) {
                this.nodes = nodes;
                if (typeof languageId === 'string') {
                    this.languageId = languageId;
                }
                this.render();
            }

            setSearchQuery(query) {
                this.searchQuery = typeof query === 'string' ? query : '';
                const clearBtn = document.getElementById('outline-search-clear');
                if (clearBtn) {
                    clearBtn.classList.toggle('visible', this.searchQuery.length > 0);
                }
                this.updateFilterSortUI();
                this.render();
            }

            isFilterActive() {
                return !!(this.searchQuery || '').trim();
            }

            updateFilterSortUI() {
                const combo = document.getElementById('sort-combo');
                const menu = document.getElementById('sort-combo-menu');
                if (!combo || !menu) {
                    return;
                }

                const filterActive = this.isFilterActive();
                combo.classList.toggle('filter-active', filterActive);

                let relevanceOpt = document.getElementById('sort-relevance-option');
                if (filterActive) {
                    if (!relevanceOpt) {
                        relevanceOpt = document.createElement('button');
                        relevanceOpt.type = 'button';
                        relevanceOpt.id = 'sort-relevance-option';
                        relevanceOpt.className = 'sort-combo-option';
                        relevanceOpt.setAttribute('data-sort', 'relevance');
                        relevanceOpt.setAttribute('role', 'option');
                        relevanceOpt.title = 'Sort by search relevance';
                        relevanceOpt.innerHTML =
                            '<span class="btn-icon" data-toolbar-icon="sortRelevance" aria-hidden="true"></span>' +
                            '<span class="sort-combo-option-label">Relevance</span>';
                        menu.insertBefore(relevanceOpt, menu.firstChild);

                        const iconEl = relevanceOpt.querySelector('[data-toolbar-icon]');
                        if (iconEl) {
                            const iconId = resolveIconId(
                                'sortRelevance',
                                this.settings.toolbarIconSettings,
                                ICON_DEFAULTS.toolbar
                            );
                            iconEl.innerHTML = resolveCatalogIcon(iconId);
                        }

                        relevanceOpt.addEventListener('click', (e) => {
                            e.stopPropagation();
                            state.setSortComboOpen(false);
                        });
                    }
                } else if (relevanceOpt) {
                    relevanceOpt.remove();
                }

                this.updateToolbar();
            }

            setSortMode(mode) {
                // Relevance is filter-only; ignore user picks for it
                if (mode === 'relevance') {
                    this.updateToolbar();
                    return;
                }
                this.sortMode = mode;
                this.updateToolbar();
            }

            setSettings(newSettings) {
                const defaults = this.getDefaultSettings();
                this.settings = {
                    ...defaults,
                    ...newSettings,
                    modernIconSettings: {
                        ...defaults.modernIconSettings,
                        ...(newSettings.modernIconSettings || {})
                    },
                    modernIconColors: {
                        ...defaults.modernIconColors,
                        ...(newSettings.modernIconColors || {})
                    },
                    fontAwesomeColors: {
                        ...defaults.fontAwesomeColors,
                        ...(newSettings.fontAwesomeColors || {})
                    },
                    toolbarIconSettings: {
                        ...defaults.toolbarIconSettings,
                        ...(newSettings.toolbarIconSettings || {})
                    },
                    emojiSettings: {
                        ...defaults.emojiSettings,
                        ...(newSettings.emojiSettings || {})
                    },
                    fontAwesomeSettings: {
                        ...defaults.fontAwesomeSettings,
                        ...(newSettings.fontAwesomeSettings || {})
                    }
                };
                
                this.updateFontStyles();
                this.updateToolbarIcons();
                this.render();
            }

            updateFontStyles() {
                const container = document.getElementById('outline-container');
                
                if (container && this.settings.fontFamily) {
                    container.style.setProperty('--outline-font-family', this.settings.fontFamily);
                    container.style.setProperty('--outline-font-size', \`\${this.settings.fontSize}px\`);
                    container.style.setProperty('--outline-line-height', this.settings.lineHeight.toString());
                    container.style.setProperty('--icon-size', \`\${this.settings.iconSize}px\`);
                    container.style.setProperty('--icon-spacing', \`\${this.settings.iconSpacing}px\`);
                    container.style.setProperty('--icon-to-text-spacing', \`\${this.settings.iconToTextSpacing}px\`);
                    container.style.setProperty('--tooltip-font-size', \`\${this.settings.tooltipFontSize}px\`);
                }
            }

            updateToolbarIcons() {
                const toolbarSettings = this.settings.toolbarIconSettings || {};
                document.querySelectorAll('[data-toolbar-icon]').forEach(el => {
                    const key = el.getAttribute('data-toolbar-icon');
                    const iconId = resolveIconId(key, toolbarSettings, ICON_DEFAULTS.toolbar);
                    el.innerHTML = resolveCatalogIcon(iconId);
                });
            }

            selectElementAtLine(line) {
                // Belirli bir satırdaki element'i bul ve seç
                const nodeElement = this.findNodeElementByLine(line);
                if (nodeElement) {
                    const content = nodeElement.querySelector('.node-content');
                    if (content) {
                        this.selectNode(content);
                        
                        // Element'i görünür yap (parent'ları expand et)
                        let parent = nodeElement.parentElement;
                        while (parent && parent.classList) {
                            if (parent.classList.contains('node-children') && parent.classList.contains('collapsed')) {
                                const parentNode = parent.previousElementSibling;
                                if (parentNode && parentNode.classList.contains('node-content')) {
                                    const chevron = parentNode.querySelector('.chevron');
                                    if (chevron) {
                                        chevron.click();
                                    }
                                }
                            }
                            parent = parent.parentElement;
                        }
                        
                        // Element'i scroll ile görünür hale getir
                        content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            }

            findNodeElementByLine(targetLine) {
                // En yakın line'daki node'u bul
                let bestMatch = null;
                let bestDistance = Infinity;
                
                const allNodes = document.querySelectorAll('.node-content');
                allNodes.forEach(nodeContent => {
                    const lineNumberElement = nodeContent.querySelector('.line-number');
                    if (lineNumberElement) {
                        const nodeLineText = lineNumberElement.textContent.replace(':', '');
                        const nodeLine = parseInt(nodeLineText, 10) - 1; // 0-indexed'e çevir
                        
                        // Cursor'dan önceki veya tam eşleşen en yakın node'u bul
                        if (nodeLine <= targetLine) {
                            const distance = targetLine - nodeLine;
                            if (distance < bestDistance) {
                                bestDistance = distance;
                                bestMatch = nodeContent.closest('.node');
                            }
                        }
                    }
                });
                
                return bestMatch;
            }

            selectNode(element) {
                if (this.selectedNode) {
                    this.selectedNode.classList.remove('selected');
                }
                this.selectedNode = element;
                element.classList.add('selected');
            }

            updateToolbar() {
                const sortModes = {
                    position: { key: 'sortPosition', label: 'Position' },
                    name: { key: 'sortName', label: 'Name' },
                    category: { key: 'sortCategory', label: 'Category' },
                    relevance: { key: 'sortRelevance', label: 'Relevance' }
                };
                const effectiveMode = this.isFilterActive() ? 'relevance' : this.sortMode;
                const mode = sortModes[effectiveMode] || sortModes.position;
                const iconEl = document.getElementById('sort-combo-icon');
                if (iconEl) {
                    iconEl.setAttribute('data-toolbar-icon', mode.key);
                    const iconId = resolveIconId(
                        mode.key,
                        this.settings.toolbarIconSettings,
                        ICON_DEFAULTS.toolbar
                    );
                    iconEl.innerHTML = resolveCatalogIcon(iconId);
                }

                const trigger = document.getElementById('sort-combo-trigger');
                if (trigger) {
                    trigger.title = this.isFilterActive()
                        ? 'Sort by: Relevance (active while filtering)'
                        : 'Sort by: ' + mode.label;
                }

                document.querySelectorAll('.sort-combo-option').forEach(opt => {
                    const isActive = opt.getAttribute('data-sort') === effectiveMode;
                    opt.classList.toggle('active', isActive);
                    opt.setAttribute('aria-selected', isActive ? 'true' : 'false');
                });
            }

            setSortComboOpen(open) {
                const combo = document.getElementById('sort-combo');
                const trigger = document.getElementById('sort-combo-trigger');
                if (!combo || !trigger) {
                    return;
                }
                combo.classList.toggle('open', open);
                trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
            }

            // Collapsed state'leri localStorage'dan al
            getCollapsedStates() {
                try {
                    const saved = localStorage.getItem(this.collapsedStateKey);
                    return saved ? JSON.parse(saved) : {};
                } catch (error) {
                    console.error('Error loading collapsed states:', error);
                    return {};
                }
            }

            // Collapsed state'leri localStorage'a kaydet
            saveCollapsedStates(states) {
                try {
                    localStorage.setItem(this.collapsedStateKey, JSON.stringify(states));
                } catch (error) {
                    console.error('Error saving collapsed states:', error);
                }
            }

            // Node'un unique key'ini oluştur (path + name + type)
            getNodeKey(node, parentPath = '') {
                const currentPath = parentPath ? \`\${parentPath}.\${node.name}\` : node.name;
                return \`\${currentPath}[\${node.type}]\`;
            }

            flattenNodesForSearch(nodes, parentPath = '', ancestorKeys = []) {
                const items = [];
                for (const node of nodes || []) {
                    const key = this.getNodeKey(node, parentPath);
                    const currentPath = parentPath ? \`\${parentPath}.\${node.name}\` : node.name;
                    items.push({
                        key,
                        name: node.name || '',
                        type: node.type || '',
                        displayName: NodeRenderer.getNodeDisplayName(node),
                        line: node.line,
                        ancestorKeys: ancestorKeys.slice()
                    });
                    if (node.children && node.children.length > 0) {
                        items.push(
                            ...this.flattenNodesForSearch(
                                node.children,
                                currentPath,
                                ancestorKeys.concat(key)
                            )
                        );
                    }
                }
                return items;
            }

            filterNodes(nodes, query) {
                const q = (query || '').trim();
                if (!q) {
                    return { nodes, forceExpand: false };
                }

                const scoreMap = new Map();

                if (typeof Fuse === 'undefined') {
                    const lower = q.toLowerCase();
                    const matchKeys = new Set();
                    const collect = (list, parentPath = '', ancestors = []) => {
                        for (const node of list || []) {
                            const key = this.getNodeKey(node, parentPath);
                            const currentPath = parentPath ? \`\${parentPath}.\${node.name}\` : node.name;
                            const name = (node.name || '').toLowerCase();
                            const display = NodeRenderer.getNodeDisplayName(node).toLowerCase();
                            const type = (node.type || '').toLowerCase();
                            let score = Infinity;
                            if (name === lower || display === lower) {
                                score = 0;
                            } else if (name.startsWith(lower) || display.startsWith(lower)) {
                                score = 0.1;
                            } else if (name.includes(lower) || display.includes(lower)) {
                                score = 0.25;
                            } else if (type.includes(lower)) {
                                score = 0.4;
                            }
                            if (score < Infinity) {
                                matchKeys.add(key);
                                scoreMap.set(key, score);
                                ancestors.forEach(k => matchKeys.add(k));
                            }
                            if (node.children && node.children.length) {
                                collect(node.children, currentPath, ancestors.concat(key));
                            }
                        }
                    };
                    collect(nodes);
                    return {
                        nodes: this.stripSearchScores(this.pruneNodesByKeys(nodes, matchKeys, '', scoreMap)),
                        forceExpand: true
                    };
                }

                const flat = this.flattenNodesForSearch(nodes);
                const fuse = new Fuse(flat, {
                    keys: [
                        { name: 'name', weight: 0.7 },
                        { name: 'displayName', weight: 0.2 },
                        { name: 'type', weight: 0.1 }
                    ],
                    threshold: 0.4,
                    ignoreLocation: true,
                    includeScore: true,
                    minMatchCharLength: 1,
                    shouldSort: true
                });

                const results = fuse.search(q);
                const visibleKeys = new Set();
                for (const result of results) {
                    const score = typeof result.score === 'number' ? result.score : 1;
                    const key = result.item.key;
                    visibleKeys.add(key);
                    if (!scoreMap.has(key) || score < scoreMap.get(key)) {
                        scoreMap.set(key, score);
                    }
                    for (const ancestorKey of result.item.ancestorKeys) {
                        visibleKeys.add(ancestorKey);
                    }
                }

                return {
                    nodes: this.stripSearchScores(this.pruneNodesByKeys(nodes, visibleKeys, '', scoreMap)),
                    forceExpand: true
                };
            }

            pruneNodesByKeys(nodes, visibleKeys, parentPath = '', scoreMap = null) {
                const result = [];
                for (const node of nodes || []) {
                    const key = this.getNodeKey(node, parentPath);
                    if (!visibleKeys.has(key)) {
                        continue;
                    }
                    const currentPath = parentPath ? \`\${parentPath}.\${node.name}\` : node.name;
                    const scoredChildren = node.children && node.children.length > 0
                        ? this.pruneNodesByKeys(node.children, visibleKeys, currentPath, scoreMap)
                        : [];

                    let score = scoreMap && scoreMap.has(key) ? scoreMap.get(key) : Infinity;
                    if (scoreMap && scoredChildren.length > 0) {
                        for (const child of scoredChildren) {
                            score = Math.min(score, child._score ?? Infinity);
                        }
                    }

                    const clone = {
                        name: node.name,
                        type: node.type,
                        visibility: node.visibility,
                        modifiers: node.modifiers,
                        line: node.line,
                        _score: score
                    };
                    if (scoredChildren.length > 0) {
                        clone.children = scoredChildren;
                    }
                    result.push(clone);
                }

                if (scoreMap) {
                    result.sort((a, b) => {
                        const scoreDiff = (a._score ?? Infinity) - (b._score ?? Infinity);
                        if (scoreDiff !== 0) {
                            return scoreDiff;
                        }
                        return (a.name || '').localeCompare(b.name || '');
                    });
                }

                return result;
            }

            stripSearchScores(nodes) {
                return (nodes || []).map((node) => {
                    const { _score, children, ...rest } = node;
                    if (children && children.length > 0) {
                        return { ...rest, children: this.stripSearchScores(children) };
                    }
                    return { ...rest };
                });
            }

            render() {
                const container = document.getElementById('outline-container');
                
                if (!this.nodes || this.nodes.length === 0) {
                    const lang = this.languageId || '';
                    const supported = ['typescript','typescriptreact','javascript','javascriptreact','markdown','json','jsonc','css','scss','less'];
                    let message = 'No symbols found';
                    if (!lang) {
                        message = 'Open a TypeScript, JavaScript, JSX, TSX, CSS, Markdown, or JSON file';
                    } else if (!supported.includes(lang)) {
                        message = 'This language is not supported yet';
                    }
                    container.innerHTML = '<div class="empty-state">' + message + '</div>';
                    return;
                }

                const { nodes: visibleNodes, forceExpand } = this.filterNodes(this.nodes, this.searchQuery);

                if (!visibleNodes || visibleNodes.length === 0) {
                    container.innerHTML = '<div class="empty-state">No matching symbols</div>';
                    return;
                }

                // Mevcut collapsed state'leri al
                const collapsedStates = this.getCollapsedStates();
                
                container.innerHTML = '';
                visibleNodes.forEach(node => {
                    container.appendChild(NodeRenderer.render(node, 0, '', collapsedStates, forceExpand));
                });
            }
        }

        // Node Rendering
        class NodeRenderer {
            static render(node, level = 0, parentPath = '', collapsedStates = {}, forceExpand = false) {
                const nodeElement = document.createElement('div');
                nodeElement.className = 'node';
                
                const nodeKey = state.getNodeKey(node, parentPath);
                const currentPath = parentPath ? \`\${parentPath}.\${node.name}\` : node.name;

                const hasChildren = node.children && node.children.length > 0;
                
                // Create node content
                const content = document.createElement('div');
                content.className = \`node-content visibility-\${node.visibility}\`;
                
                // Add modifier classes
                if (node.modifiers) {
                    node.modifiers.forEach(mod => {
                        content.classList.add(\`modifier-\${mod}\`);
                    });
                }

                // Build content HTML
                content.innerHTML = \`
                    \${hasChildren ? \`<span class="chevron">\${IconManager.getChevronIcon()}</span>\` : '<span style="width: 0.875rem;"></span>'}
                    <div class="features">
                        \${state.settings.showIconsInLabel && state.settings.iconType !== 'none' ? \`<span class="\${IconManager.getIconClass()}"\${IconManager.getIconColorAttr(node.type)} data-tooltip="\${NodeRenderer.getTypeTooltip(node)}">\${IconManager.getTypeIcon(node.type)}</span>\` : ''}
                        \${NodeRenderer.getFeatureIcons(node)}
                    </div>
                    <span class="node-name">\${NodeRenderer.getNodeDisplayName(node)}</span>
                    <span class="line-number">:\${node.line + 1}</span>
                \`;

                // Event listeners — chevron SVG tıklamaları closest ile yakalanır
                const chevronEl = content.querySelector('.chevron');
                if (chevronEl) {
                    chevronEl.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        NodeRenderer.toggleNode(nodeElement, nodeKey);
                    });
                }

                content.addEventListener('click', (e) => {
                    if (e.target.closest('.chevron')) {
                        return;
                    }
                    state.selectNode(content);
                    vscode.postMessage({ type: 'goToLine', line: node.line });
                });

                // Çift tıklama event listener'ı - bloğu seç
                content.addEventListener('dblclick', (event) => {
                    if (event.target.closest('.chevron')) {
                        return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();

                    state.selectNode(content);

                    setTimeout(() => {
                        vscode.postMessage({
                            type: 'selectBlock',
                            line: node.line,
                            name: node.name,
                            nodeType: node.type
                        });
                    }, 10);
                });

                nodeElement.appendChild(content);

                // Add children
                if (hasChildren) {
                    const childrenContainer = document.createElement('div');
                    
                    // Saved state'e göre collapsed durumunu ayarla
                    // Default olarak collapsed, eğer açık olarak kaydedildiyse expanded yap
                    // Arama aktifken eşleşen dalları açık tut
                    const isExpanded = forceExpand || collapsedStates[nodeKey] === false;
                    childrenContainer.className = isExpanded ? 'node-children' : 'node-children collapsed';
                    
                    // Chevron'u da duruma göre ayarla
                    const chevron = content.querySelector('.chevron');
                    if (isExpanded) {
                        chevron.classList.add('expanded');
                    }
                    
                    node.children.forEach(child => {
                        childrenContainer.appendChild(
                            NodeRenderer.render(child, level + 1, currentPath, collapsedStates, forceExpand)
                        );
                    });
                    
                    nodeElement.appendChild(childrenContainer);
                }

                return nodeElement;
            }

            static toggleNode(nodeElement, nodeKey) {
                const chevron = nodeElement.querySelector('.chevron');
                const children = nodeElement.querySelector('.node-children');
                
                if (!children) return;

                const isCollapsed = children.classList.contains('collapsed');
                
                if (isCollapsed) {
                    // Expand
                    children.classList.remove('collapsed');
                    chevron.classList.add('expanded');
                } else {
                    // Collapse
                    children.classList.add('collapsed');
                    chevron.classList.remove('expanded');
                }
                
                // State'i kaydet (collapsed = true, expanded = false)
                const collapsedStates = state.getCollapsedStates();
                collapsedStates[nodeKey] = !isCollapsed; // toggle: collapsed ise false (expanded), değilse true (collapsed)
                state.saveCollapsedStates(collapsedStates);
            }

            static getFeatureIcons(node) {
                const features = [];
                
                // showIconsInLabel ayarı false veya iconType none ise hiç ikon gösterme
                if (!state.settings.showIconsInLabel || state.settings.iconType === 'none') {
                    return '';
                }
                
                // Visibility ikonları her zaman göster (showIconsInLabel true ise)
                const visIcon = IconManager.getVisibilityIcon(node.visibility);
                if (visIcon) {
                    const iconClass = IconManager.getFeatureIconClass();
                    const visibilityName = node.visibility.charAt(0).toUpperCase() + node.visibility.slice(1);
                    const tooltip = state.settings.showTooltipPrefixes ? \`Visibility: \${visibilityName}\` : visibilityName;
                    features.push(\`<span class="\${iconClass} tooltip"\${IconManager.getIconColorAttr(node.visibility)} data-tooltip="\${tooltip}">\${visIcon}</span>\`);
                }
                
                // Modifiers - duplicate kontrolü ile
                if (node.modifiers) {
                    const modifiers = [...node.modifiers];
                    const addedModifiers = new Set(); // Duplicate kontrolü için
                    
                    // Export default'u tek ikon olarak göster
                    if (modifiers.includes('export') && modifiers.includes('default')) {
                        const defaultIcon = IconManager.getModifierIcon('default');
                        if (defaultIcon) {
                            const iconClass = IconManager.getFeatureIconClass();
                            const tooltip = state.settings.showTooltipPrefixes ? 'Modifier: Export Default' : 'Export Default';
                            features.push(\`<span class="\${iconClass} tooltip"\${IconManager.getIconColorAttr('default')} data-tooltip="\${tooltip}">\${defaultIcon}</span>\`);
                        }
                        addedModifiers.add('export');
                        addedModifiers.add('default');
                    }
                    
                    // Diğer modifier'ları tek tek göster (duplicate olmayacak şekilde)
                    modifiers.forEach(mod => {
                        if (!addedModifiers.has(mod)) {
                            const icon = IconManager.getModifierIcon(mod);
                            if (icon) {
                                const iconClass = IconManager.getFeatureIconClass();
                                const modifierName = mod.charAt(0).toUpperCase() + mod.slice(1);
                                const tooltip = state.settings.showTooltipPrefixes ? \`Modifier: \${modifierName}\` : modifierName;
                                features.push(\`<span class="\${iconClass} tooltip"\${IconManager.getIconColorAttr(mod)} data-tooltip="\${tooltip}">\${icon}</span>\`);
                                addedModifiers.add(mod);
                            }
                        }
                    });
                }
                
                return features.join('');
            }

            static getNodeDisplayName(node) {
                let displayName = node.name;
                
                // showVisibilityInLabel true ise visibility'yi [brackets] içinde ekle
                if (state.settings.showVisibilityInLabel) {
                    displayName += \` [\${node.visibility}]\`;
                }
                
                return displayName;
            }

            static getTypeTooltip(node) {
                const type = node.type.charAt(0).toUpperCase() + node.type.slice(1);
                return state.settings.showTooltipPrefixes ? \`Type: \${type}\` : type;
            }
        }

        // Icon Management
        class IconManager {
            static getIconClass() {
                if (state.settings.iconType === 'fontawesome') {
                    return 'fa-icon tooltip';
                }
                if (state.settings.iconType === 'modern') {
                    return 'svg-icon tooltip';
                }
                return 'type-icon tooltip';
            }

            static getFeatureIconClass() {
                if (state.settings.iconType === 'fontawesome') {
                    return 'feature-fa-icon';
                }
                if (state.settings.iconType === 'modern') {
                    return 'feature-svg-icon';
                }
                return 'feature-icon';
            }

            static getIconColor(key) {
                let colors = {};
                if (state.settings.iconType === 'modern') {
                    colors = state.settings.modernIconColors || {};
                } else if (state.settings.iconType === 'fontawesome') {
                    colors = state.settings.fontAwesomeColors || {};
                } else {
                    return '';
                }
                const color = (colors[key] || (ICON_DEFAULTS.colors && ICON_DEFAULTS.colors[key]) || '').trim();
                if (!color) {
                    return '';
                }
                // Reject values that could break out of the style attribute
                if (/[;"'<>\\\\]/.test(color)) {
                    return '';
                }
                return color;
            }

            static getIconColorAttr(key) {
                if (state.settings.iconType !== 'modern' && state.settings.iconType !== 'fontawesome') {
                    return '';
                }
                const color = IconManager.getIconColor(key);
                return color ? \` style="color: \${color}"\` : '';
            }

            static getModernSvg(key) {
                const iconId = resolveIconId(
                    key,
                    state.settings.modernIconSettings,
                    ICON_DEFAULTS.modern
                );
                return resolveCatalogIcon(iconId);
            }

            static getChevronIcon() {
                const iconId = resolveIconId(
                    'chevron',
                    state.settings.toolbarIconSettings,
                    ICON_DEFAULTS.toolbar
                );
                return resolveCatalogIcon(iconId);
            }

            static getTypeIcon(type) {
                if (state.settings.iconType === 'modern') {
                    return IconManager.getModernSvg(type);
                }
                if (state.settings.iconType === 'fontawesome') {
                    const faClass = state.settings.fontAwesomeSettings[type]
                        || (ICON_DEFAULTS.fontawesome && ICON_DEFAULTS.fontawesome[type]);
                    return faClass ? \`<i class="\${faClass}"></i>\` : '<i class="fas fa-question"></i>';
                }
                if (state.settings.iconType === 'emoji') {
                    return state.settings.emojiSettings[type] || '❓';
                }
                return '';
            }

            static getVisibilityIcon(visibility) {
                if (!visibility || visibility === 'none') {
                    return '';
                }
                if (state.settings.iconType === 'modern') {
                    return IconManager.getModernSvg(visibility);
                }
                if (state.settings.iconType === 'fontawesome') {
                    const faClass = state.settings.fontAwesomeSettings[visibility]
                        || (ICON_DEFAULTS.fontawesome && ICON_DEFAULTS.fontawesome[visibility]);
                    return faClass ? \`<i class="\${faClass}"></i>\` : '';
                }
                if (state.settings.iconType === 'emoji') {
                    return state.settings.emojiSettings[visibility] || '';
                }
                return '';
            }

            static getModifierIcon(modifier) {
                if (state.settings.iconType === 'modern') {
                    return IconManager.getModernSvg(modifier);
                }
                if (state.settings.iconType === 'fontawesome') {
                    const faClass = state.settings.fontAwesomeSettings[modifier]
                        || (ICON_DEFAULTS.fontawesome && ICON_DEFAULTS.fontawesome[modifier]);
                    return faClass ? \`<i class="\${faClass}"></i>\` : '';
                }
                if (state.settings.iconType === 'emoji') {
                    return state.settings.emojiSettings[modifier] || '';
                }
                return '';
            }
        }

        // Utility Functions
        class Utils {
            static collapseAll() {
                // Tüm node'ları collapse yap
                document.querySelectorAll('.node-children').forEach(children => {
                    children.classList.add('collapsed');
                });
                
                document.querySelectorAll('.chevron').forEach(chevron => {
                    chevron.classList.remove('expanded');
                });
                
                // LocalStorage'ı da güncelle - tüm node'ları collapsed olarak işaretle
                const allNodes = document.querySelectorAll('.node');
                const collapsedStates = {};
                
                allNodes.forEach(nodeElement => {
                    const hasChildren = nodeElement.querySelector('.node-children');
                    if (hasChildren) {
                        // Node key'ini bulmak için node'un path'ini oluşturmaya çalışalım
                        // Bu biraz karmaşık olacak, basit çözüm olarak tüm state'i temizleyip
                        // default collapsed duruma getirelim
                    }
                });
                
                // Basit çözüm: collapsed state'leri temizle, default'a döner (collapsed)
                state.saveCollapsedStates({});
            }
        }

        // Initialize
        const vscode = acquireVsCodeApi();
        const state = new OutlineState();

        // Event Listeners
        document.getElementById('refresh-btn').addEventListener('click', () => {
            vscode.postMessage({ type: 'refresh' });
        });

        document.getElementById('collapse-all-btn').addEventListener('click', () => {
            Utils.collapseAll();
        });

        // Outline search (Fuse.js)
        const searchInput = document.getElementById('outline-search-input');
        const searchClearBtn = document.getElementById('outline-search-clear');
        let searchDebounceTimer;

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    state.setSearchQuery(searchInput.value);
                }, 120);
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    searchInput.value = '';
                    state.setSearchQuery('');
                    searchInput.blur();
                }
            });
        }

        if (searchClearBtn) {
            searchClearBtn.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.focus();
                }
                state.setSearchQuery('');
            });
        }

        // Sort icon combobox
        const sortCombo = document.getElementById('sort-combo');
        const sortComboTrigger = document.getElementById('sort-combo-trigger');
        const sortComboMenu = document.getElementById('sort-combo-menu');

        if (sortComboTrigger && sortCombo && sortComboMenu) {
            sortComboTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = sortCombo.classList.contains('open');
                state.setSortComboOpen(!isOpen);
            });

            sortComboMenu.querySelectorAll('.sort-combo-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const mode = option.getAttribute('data-sort');
                    if (!mode) {
                        return;
                    }
                    state.setSortMode(mode);
                    state.setSortComboOpen(false);
                    vscode.postMessage({ type: 'sortBy', mode });
                });
            });

            document.addEventListener('click', (e) => {
                if (!sortCombo.contains(e.target)) {
                    state.setSortComboOpen(false);
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    state.setSortComboOpen(false);
                }
            });
        }

        // Message Handler
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'updateOutline':
                    if (message.settings) {
                        state.setSettings(message.settings);
                    }
                    state.setNodes(message.nodes, message.languageId);
                    state.setSortMode(message.sortMode);
                    // Toolbar'ı da güncelleyerek aktif sort butonunu göster
                    state.updateToolbar();
                    break;
                case 'selectElementAtLine':
                    state.selectElementAtLine(message.line);
                    break;
            }
        });

        // Viewport-aware floating tooltip (stays fully visible in narrow panels)
        (function setupFloatingTooltip() {
            const tip = document.getElementById('outline-tooltip');
            if (!tip) {
                return;
            }

            let hideTimer;

            function hideTip() {
                tip.classList.remove('visible');
                tip.setAttribute('aria-hidden', 'true');
            }

            function showTip(target) {
                const text = target.getAttribute('data-tooltip');
                if (!text) {
                    return;
                }
                clearTimeout(hideTimer);
                tip.textContent = text;
                tip.classList.add('visible');
                tip.setAttribute('aria-hidden', 'false');

                const margin = 8;
                const rect = target.getBoundingClientRect();
                const tipRect = tip.getBoundingClientRect();
                const vw = window.innerWidth;
                const vh = window.innerHeight;

                let left = rect.left;
                let top = rect.top - tipRect.height - 6;

                if (top < margin) {
                    top = rect.bottom + 6;
                }
                if (top + tipRect.height > vh - margin) {
                    top = Math.max(margin, vh - tipRect.height - margin);
                }

                if (left + tipRect.width > vw - margin) {
                    left = vw - tipRect.width - margin;
                }
                if (left < margin) {
                    left = margin;
                }

                tip.style.left = left + 'px';
                tip.style.top = top + 'px';
            }

            document.addEventListener('mouseover', (e) => {
                const target = e.target && e.target.closest
                    ? e.target.closest('[data-tooltip]')
                    : null;
                if (target && target.getAttribute('data-tooltip')) {
                    showTip(target);
                }
            });

            document.addEventListener('mouseout', (e) => {
                const from = e.target && e.target.closest
                    ? e.target.closest('[data-tooltip]')
                    : null;
                const to = e.relatedTarget && e.relatedTarget.closest
                    ? e.relatedTarget.closest('[data-tooltip]')
                    : null;
                if (from && from !== to) {
                    hideTimer = setTimeout(hideTip, 80);
                }
            });

            document.addEventListener('scroll', hideTip, true);
            window.addEventListener('resize', hideTip);
        })();

        // Apply initial styles and toolbar icons
        state.updateFontStyles();
        state.updateToolbarIcons();
        state.updateToolbar();
    `;
    }

    private getNonce(): string {
        const possible =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let text = "";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}