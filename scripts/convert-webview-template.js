const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "webview-template.ts");
let s = fs.readFileSync(file, "utf8");

// Strip CommonJS boilerplate
s = s.replace(/^"use strict";\r?\n/, "");
s = s.replace(
  /^Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);\r?\n/,
  ""
);
s = s.replace(/^exports\.WebViewTemplateManager = void 0;\r?\n/, "");
s = s.replace(
  /\r?\nexports\.WebViewTemplateManager = WebViewTemplateManager;\r?\n\/\/# sourceMappingURL=.*$/,
  ""
);

if (!s.startsWith("import")) {
  s = 'import * as vscode from "vscode";\n\n' + s;
}

// Update class method signatures with types
s = s.replace(
  /generateHTML\(webview\) \{/,
  "generateHTML(webview: vscode.Webview, extensionUri: vscode.Uri): string {"
);

// Inject FontAwesome local URI + CSP after generateHTML opening
const injectAfter = "generateHTML(webview: vscode.Webview, extensionUri: vscode.Uri): string {";
const injectCode = `
        const fontAwesomeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(extensionUri, "node_modules", "@fortawesome", "fontawesome-free", "css", "all.min.css")
        );
        const nonce = this.getNonce();
`;

if (!s.includes("fontAwesomeUri")) {
  s = s.replace(injectAfter, injectAfter + injectCode);
}

// Replace CDN FontAwesome with local + CSP
s = s.replace(
  /<title>TS Outliner<\/title>\s*<!-- FontAwesome CDN -->\s*<link rel="stylesheet" href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/6\.4\.0\/css\/all\.min\.css" crossorigin="anonymous">/,
  `<title>TS Outliner</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src \${webview.cspSource} 'unsafe-inline'; font-src \${webview.cspSource}; script-src 'nonce-\${nonce}';">
    <link rel="stylesheet" href="\${fontAwesomeUri}">`
);

// Update script tag with nonce
s = s.replace(
  /<script>\s*\$\{this\.getJavaScript\(\)\}\s*<\/script>/,
  `<script nonce="\${nonce}">
        \${this.getJavaScript()}
    </script>`
);

// Empty state + unsupported language messaging
s = s.replace(
  "No TypeScript symbols found",
  "No symbols found"
);

s = s.replace(
  '<div class="section-header">TS OUTLINER</div>',
  '<div class="section-header">OUTLINE</div>'
);

// Add heading / variable icons to default emoji settings
s = s.replace(
  `"interface": "📋"
                    },
                    fontAwesomeSettings: {`,
  `"interface": "📋",
                        "heading": "📑",
                        "variable": "💠",
                        "constant": "🔒",
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
                    fontAwesomeSettings: {`
);

s = s.replace(
  `"interface": "fas fa-clipboard-list"
                    },
                    iconType: "emoji",`,
  `"interface": "fas fa-clipboard-list",
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
                    iconType: "emoji",`
);

// Skip visibility icons for "none"
s = s.replace(
  `static getVisibilityIcon(visibility) {
                if (state.settings.iconType === 'fontawesome') {`,
  `static getVisibilityIcon(visibility) {
                if (!visibility || visibility === 'none') {
                    return '';
                }
                if (state.settings.iconType === 'fontawesome') {`
);

// Better empty-state when unsupported / no file
s = s.replace(
  `if (!this.nodes || this.nodes.length === 0) {
                    container.innerHTML = '<div class="empty-state">No symbols found</div>';
                    return;
                }`,
  `if (!this.nodes || this.nodes.length === 0) {
                    const lang = this.languageId || '';
                    const supported = ['typescript','typescriptreact','javascript','javascriptreact','markdown'];
                    let message = 'No symbols found';
                    if (!lang) {
                        message = 'Open a TypeScript, JavaScript, JSX, TSX, or Markdown file';
                    } else if (!supported.includes(lang)) {
                        message = 'This language is not supported yet';
                    }
                    container.innerHTML = '<div class="empty-state">' + message + '</div>';
                    return;
                }`
);

// Track languageId on state
s = s.replace(
  `this.settings = this.getDefaultSettings();
            }`,
  `this.settings = this.getDefaultSettings();
                this.languageId = '';
            }`
);

s = s.replace(
  `setNodes(nodes) {
                this.nodes = nodes;
                this.render();
            }`,
  `setNodes(nodes, languageId) {
                this.nodes = nodes;
                if (typeof languageId === 'string') {
                    this.languageId = languageId;
                }
                this.render();
            }`
);

// Update message handler for languageId
s = s.replace(
  `state.setNodes(message.nodes);
                    state.setSortMode(message.sortMode);`,
  `state.setNodes(message.nodes, message.languageId);
                    state.setSortMode(message.sortMode);`
);

// Add getNonce + visibility-none CSS before closing class
if (!s.includes("getNonce()")) {
  s = s.replace(
    /\/\* Visibility Styling \*\/\s*\.visibility-public/,
    `/* Visibility Styling */
        .visibility-none { border-left: 2px solid transparent; }
        .visibility-public`
  );

  s = s.replace(
    /(\n)(class WebViewTemplateManager \{)/,
    "$1$2"
  );

  // Add methods at end of class before final closing
  const lastBrace = s.lastIndexOf("\n}");
  const methods = `

    private getNonce(): string {
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let text = "";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
`;
  s = s.slice(0, lastBrace) + methods + s.slice(lastBrace);
}

// Export the class properly for TS
s = s.replace(
  /class WebViewTemplateManager \{/,
  "export class WebViewTemplateManager {"
);

fs.writeFileSync(file, s);
console.log("webview-template.ts converted, length:", s.length);
