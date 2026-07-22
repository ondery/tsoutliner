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
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TS Outliner</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
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

        .section-header {
            font-size: 0.8em; /* Relative to container font size */
            font-weight: 600;
            color: var(--vscode-descriptionForeground);
            text-transform: uppercase;
            letter-spacing: 0.025em;
            padding: var(--spacing-xs) var(--spacing-sm);
            margin-bottom: var(--spacing-xs);
            border-bottom: 1px solid var(--vscode-panel-border);
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
            overflow: hidden;
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

        /* Visibility Styling */
        .visibility-none { border-left: 2px solid transparent; }
        .visibility-public { border-left: 2px solid #10b981; }
        .visibility-private { border-left: 2px solid #ef4444; }
        .visibility-protected { border-left: 2px solid #f59e0b; }

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

        /* Tooltip */
        .tooltip {
            position: relative;
        }

        .tooltip::after {
            content: attr(data-tooltip);
            position: absolute;
            top: 50%;
            left: 0px; /* Icon'un sol hizasına yerleştir */
            transform: translateY(-130%); /* Dikey olarak ortala */
            background-color: var(--vscode-editorHoverWidget-background);
            color: var(--vscode-editorHoverWidget-foreground);
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--border-radius);
            font-size: var(--tooltip-font-size); /* Use tooltip font size setting */
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
            z-index: 1000;
            border: 1px solid var(--vscode-editorHoverWidget-border);
            min-width: max-content;
        }

        /* Tooltip'in sağ tarafa taştığı durumlarda sol tarafa göster */
        .tooltip::before {
            content: '';
            position: absolute;
            top: 50%;
            right: calc(100% + 0px);
            transform: translateY(0%);
            width: 0;
            height: 0;
            pointer-events: none;
            opacity: 0;
            z-index: 999;
        }
        
        .tooltip:hover::after {
            opacity: 1;
        }
        
        /* Container'ın sağ kenarına yakın tooltip'ler için alternatif pozisyon */
        @media (max-width: 400px) {
            .tooltip::after {
                left: auto;
                right: calc(100% + 8px);
            }
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
            <button class="btn" id="select-font-btn" title="Select Font Family">
                <span class="btn-icon" data-toolbar-icon="font" aria-hidden="true"></span>
                <span class="btn-label">Font</span>
            </button>
            <div class="toolbar-divider" role="separator" aria-hidden="true"></div>
            <button class="btn btn-icon-only" id="sort-position" title="Sort by position in file">
                <span class="btn-icon" data-toolbar-icon="sortPosition" aria-hidden="true"></span>
            </button>
            <button class="btn btn-icon-only" id="sort-name" title="Sort alphabetically by name">
                <span class="btn-icon" data-toolbar-icon="sortName" aria-hidden="true"></span>
            </button>
            <button class="btn btn-icon-only" id="sort-category" title="Sort by element category">
                <span class="btn-icon" data-toolbar-icon="sortCategory" aria-hidden="true"></span>
            </button>
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
                <div class="section-header">OUTLINE</div>
                <div id="outline-container" class="outline-container">
                    <div class="empty-state">Loading...</div>
                </div>
            </div>
        </div>
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
                    fontAwesomeSettings: {
                        "public": "fas fa-globe",
                        "private": "fas fa-lock",
                        "protected": "fas fa-shield-alt",
                        "static": "fas fa-thumbtack",
                        "readonly": "fas fa-book-open",
                        "abstract": "fas fa-theater-masks",
                        "async": "fas fa-bolt",
                        "export": "fas fa-share-square",
                        "default": "fas fa-star",
                        "constructor": "fas fa-hammer",
                        "property": "fas fa-tag",
                        "method": "fas fa-cog",
                        "function": "fas fa-wrench",
                        "getter": "fas fa-download",
                        "setter": "fas fa-upload",
                        "class": "fas fa-cube",
                        "interface": "fas fa-clipboard-list",
                        "heading": "fas fa-heading",
                        "variable": "fas fa-cube",
                        "constant": "fas fa-lock",
                        "enum": "fas fa-list-ol",
                        "enumMember": "fas fa-circle",
                        "module": "fas fa-folder",
                        "namespace": "fas fa-folder-open",
                        "typeAlias": "fas fa-tag",
                        "file": "fas fa-file",
                        "object": "fas fa-shapes",
                        "array": "fas fa-list",
                        "key": "fas fa-key",
                        "event": "fas fa-bolt",
                        "operator": "fas fa-plus",
                        "typeParameter": "fas fa-font"
                    },
                    modernIconSettings: { ...ICON_DEFAULTS.modern },
                    toolbarIconSettings: { ...ICON_DEFAULTS.toolbar },
                    iconType: "modern",
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

            setSortMode(mode) {
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
                document.querySelectorAll('.toolbar .btn[id^="sort-"]').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                const activeBtn = document.getElementById(\`sort-\${this.sortMode}\`);
                if (activeBtn) {
                    activeBtn.classList.add('active');
                }
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

            render() {
                const container = document.getElementById('outline-container');
                
                if (!this.nodes || this.nodes.length === 0) {
                    const lang = this.languageId || '';
                    const supported = ['typescript','typescriptreact','javascript','javascriptreact','markdown','json','jsonc'];
                    let message = 'No symbols found';
                    if (!lang) {
                        message = 'Open a TypeScript, JavaScript, JSX, TSX, Markdown, or JSON file';
                    } else if (!supported.includes(lang)) {
                        message = 'This language is not supported yet';
                    }
                    container.innerHTML = '<div class="empty-state">' + message + '</div>';
                    return;
                }

                // Mevcut collapsed state'leri al
                const collapsedStates = this.getCollapsedStates();
                
                container.innerHTML = '';
                this.nodes.forEach(node => {
                    container.appendChild(NodeRenderer.render(node, 0, '', collapsedStates));
                });
            }
        }

        // Node Rendering
        class NodeRenderer {
            static render(node, level = 0, parentPath = '', collapsedStates = {}) {
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
                        \${state.settings.showIconsInLabel && state.settings.iconType !== 'none' ? \`<span class="\${IconManager.getIconClass()}" data-tooltip="\${NodeRenderer.getTypeTooltip(node)}">\${IconManager.getTypeIcon(node.type)}</span>\` : ''}
                        \${NodeRenderer.getFeatureIcons(node)}
                    </div>
                    <span class="node-name">\${NodeRenderer.getNodeDisplayName(node)}</span>
                    <span class="line-number">:\${node.line + 1}</span>
                \`;

                // Event listeners
                content.addEventListener('click', (e) => {
                    if (e.target.classList.contains('chevron')) {
                        e.stopPropagation();
                        NodeRenderer.toggleNode(nodeElement, nodeKey);
                    } else {
                        // Click event için stop propagation kullanmıyoruz ki dblclick çalışabilsin
                        state.selectNode(content);
                        vscode.postMessage({ type: 'goToLine', line: node.line });
                    }
                });

                // Çift tıklama event listener'ı - bloğu seç
                content.addEventListener('dblclick', (event) => {
                    // Chevron'a double-click yapılmadığından emin ol
                    if (!event.target || !event.target.classList.contains('chevron')) {
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation(); // Diğer event listener'ları engelle
                        
                        state.selectNode(content);
                        
                        // Timeout ile message gönder - event loop'tan sonra
                        setTimeout(() => {
                            const message = { 
                                type: 'selectBlock', 
                                line: node.line,
                                name: node.name,
                                nodeType: node.type
                            };
                            vscode.postMessage(message);
                        }, 10);
                    }
                });

                nodeElement.appendChild(content);

                // Add children
                if (hasChildren) {
                    const childrenContainer = document.createElement('div');
                    
                    // Saved state'e göre collapsed durumunu ayarla
                    // Default olarak collapsed, eğer açık olarak kaydedildiyse expanded yap
                    const isExpanded = collapsedStates[nodeKey] === false; // false = expanded, true/undefined = collapsed
                    childrenContainer.className = isExpanded ? 'node-children' : 'node-children collapsed';
                    
                    // Chevron'u da duruma göre ayarla
                    const chevron = content.querySelector('.chevron');
                    if (isExpanded) {
                        chevron.classList.add('expanded');
                    }
                    
                    node.children.forEach(child => {
                        childrenContainer.appendChild(NodeRenderer.render(child, level + 1, currentPath, collapsedStates));
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
                    features.push(\`<span class="\${iconClass} tooltip" data-tooltip="\${tooltip}">\${visIcon}</span>\`);
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
                            features.push(\`<span class="\${iconClass} tooltip" data-tooltip="\${tooltip}">\${defaultIcon}</span>\`);
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
                                features.push(\`<span class="\${iconClass} tooltip" data-tooltip="\${tooltip}">\${icon}</span>\`);
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
                    const faClass = state.settings.fontAwesomeSettings[type];
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
                    const faClass = state.settings.fontAwesomeSettings[visibility];
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
                    const faClass = state.settings.fontAwesomeSettings[modifier];
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

        document.getElementById('select-font-btn').addEventListener('click', () => {
            vscode.postMessage({ type: 'selectFont' });
        });

        // Sort butonlarını kontrol et ve event listener'ları ekle
        const sortPositionBtn = document.getElementById('sort-position');
        const sortNameBtn = document.getElementById('sort-name');
        const sortCategoryBtn = document.getElementById('sort-category');
        
        if (sortPositionBtn) {
            sortPositionBtn.addEventListener('click', () => {
                state.setSortMode('position'); // Hemen UI'da aktif durumu göster
                state.updateToolbar();
                vscode.postMessage({ type: 'sortBy', mode: 'position' });
            });
        }

        if (sortNameBtn) {
            sortNameBtn.addEventListener('click', () => {
                state.setSortMode('name'); // Hemen UI'da aktif durumu göster
                state.updateToolbar();
                vscode.postMessage({ type: 'sortBy', mode: 'name' });
            });
        }

        if (sortCategoryBtn) {
            sortCategoryBtn.addEventListener('click', () => {
                state.setSortMode('category'); // Hemen UI'da aktif durumu göster
                state.updateToolbar();
                vscode.postMessage({ type: 'sortBy', mode: 'category' });
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