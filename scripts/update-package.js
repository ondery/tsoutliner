const fs = require("fs");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

pkg.name = "tsoutliner";
pkg.displayName = "TS Outliner";
pkg.description =
  "Enhanced outline view for TypeScript, JavaScript, JSX, TSX, and Markdown with customizable icons, fonts, and sorting.";
pkg.version = "0.1.0";
pkg.publisher = "ondery";
pkg.author = { name: "Öndery", url: "https://github.com/ondery" };
pkg.icon = "media/icon.png";
pkg.galleryBanner = { color: "#1e1e1e", theme: "dark" };
pkg.keywords = [
  "outline",
  "typescript",
  "javascript",
  "jsx",
  "tsx",
  "markdown",
  "symbols",
  "navigation",
  "webview",
  "icons",
];
pkg.categories = ["Programming Languages", "Other"];
pkg.homepage = "https://github.com/ondery/tsoutliner#readme";
pkg.bugs = { url: "https://github.com/ondery/tsoutliner/issues" };
pkg.repository = {
  type: "git",
  url: "https://github.com/ondery/tsoutliner.git",
};
pkg.engines = { vscode: "^1.74.0" };
pkg.activationEvents = [
  "onLanguage:typescript",
  "onLanguage:typescriptreact",
  "onLanguage:javascript",
  "onLanguage:javascriptreact",
  "onLanguage:markdown",
  "onView:tsOutlineEnhancer.webview",
];
pkg.main = "./out/extension.js";

pkg.contributes.commands = [
  {
    command: "tsOutlineEnhancer.refresh",
    title: "Refresh Outline",
    category: "TS Outliner",
    icon: "$(refresh)",
  },
  {
    command: "tsOutlineEnhancer.openEmojiSettings",
    title: "Open Emoji Settings",
    category: "TS Outliner",
  },
  {
    command: "tsOutlineEnhancer.openIconSettings",
    title: "Open Icon Settings",
    category: "TS Outliner",
  },
  {
    command: "tsOutlineEnhancer.openFontSettings",
    title: "Open Font Settings",
    category: "TS Outliner",
  },
  {
    command: "tsOutlineEnhancer.openIconAppearanceSettings",
    title: "Open Icon Appearance Settings",
    category: "TS Outliner",
  },
  {
    command: "tsOutlineEnhancer.openAllSettings",
    title: "Open Settings",
    category: "TS Outliner",
  },
  {
    command: "tsOutlineEnhancer.selectFont",
    title: "Select Font Family",
    category: "TS Outliner",
    icon: "$(symbol-text)",
  },
  {
    command: "tsOutlineEnhancer.sortByPosition",
    title: "Sort By: Position",
    category: "TS Outliner",
  },
  {
    command: "tsOutlineEnhancer.sortByName",
    title: "Sort By: Name",
    category: "TS Outliner",
  },
  {
    command: "tsOutlineEnhancer.sortByCategory",
    title: "Sort By: Category",
    category: "TS Outliner",
  },
];

pkg.contributes.viewsContainers = {
  activitybar: [
    {
      id: "ts-outliner",
      title: "TS Outliner",
      icon: "media/activitybar.svg",
    },
  ],
};

pkg.contributes.views = {
  "ts-outliner": [
    {
      type: "webview",
      id: "tsOutlineEnhancer.webview",
      name: "Outline",
      contextualTitle: "TS Outliner",
      icon: "media/activitybar.svg",
    },
  ],
};

pkg.contributes.configuration.title = "TS Outliner";
const props = pkg.contributes.configuration.properties;

const emoji = props["tsOutlineEnhancer.emojiSettings"];
emoji.default = {
  ...emoji.default,
  heading: "📑",
  variable: "💠",
  constant: "🔷",
  enum: "📚",
  enumMember: "▪️",
  module: "📁",
  namespace: "📂",
  typeAlias: "🏷️",
  file: "📄",
  object: "🧩",
  array: "📋",
  key: "🔑",
  event: "📡",
  operator: "➗",
  typeParameter: "Ｔ",
};
emoji.description =
  "Emoji icons for outline symbols, visibility, and modifiers.";
emoji.additionalProperties = true;

const fa = props["tsOutlineEnhancer.fontAwesomeSettings"];
fa.default = {
  ...fa.default,
  heading: "fas fa-heading",
  variable: "fas fa-cube",
  constant: "fas fa-lock",
  enum: "fas fa-list-ol",
  enumMember: "fas fa-circle",
  module: "fas fa-folder",
  namespace: "fas fa-folder-open",
  typeAlias: "fas fa-tag",
  file: "fas fa-file",
  object: "fas fa-shapes",
  array: "fas fa-list",
  key: "fas fa-key",
  event: "fas fa-bolt",
  operator: "fas fa-plus",
  typeParameter: "fas fa-font",
};
fa.description =
  "Font Awesome class names for outline symbols, visibility, and modifiers.";
fa.additionalProperties = true;

props["tsOutlineEnhancer.sortMode"].description =
  "Default sorting mode for outline elements";
props["tsOutlineEnhancer.sortMode"].enumDescriptions = [
  "Sort by position in source",
  "Sort alphabetically by name",
  "Sort by category (class, interface, heading, function, ...)",
];

pkg.scripts = {
  "vscode:prepublish": "npm run compile",
  compile: "tsc -p ./",
  watch: "tsc -watch -p ./",
  lint: "tsc -p ./ --noEmit",
  package: "vsce package",
};

pkg.dependencies = {
  "@fortawesome/fontawesome-free": "^6.5.0",
};

pkg.devDependencies = {
  "@types/vscode": "^1.74.0",
  "@types/node": "^18.19.0",
  "@vscode/vsce": "^2.26.0",
  typescript: "^5.4.0",
};

delete pkg.__metadata;

fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log("package.json updated");
