import * as fs from "fs";
import * as os from "os";
import * as path from "path";

/**
 * Discovers available fonts for the outline font picker.
 */
export class SystemFonts {
  static getWindowsFonts(): string[] {
    const fonts = new Set<string>();
    const fontDirs = [
      "C:\\Windows\\Fonts",
      path.join(os.homedir(), "AppData\\Local\\Microsoft\\Windows\\Fonts"),
    ];

    const fontMappings: Record<string, string> = {
      arial: "Arial",
      times: "Times New Roman",
      cour: "Courier New",
      tahoma: "Tahoma",
      verdana: "Verdana",
      georgia: "Georgia",
      trebuc: "Trebuchet MS",
      impact: "Impact",
      consola: "Consolas",
      calibri: "Calibri",
      cambria: "Cambria",
      candara: "Candara",
      constantia: "Constantia",
      corbel: "Corbel",
      segoeui: "Segoe UI",
    };

    for (const fontDir of fontDirs) {
      try {
        if (!fs.existsSync(fontDir)) {
          continue;
        }
        for (const file of fs.readdirSync(fontDir)) {
          const ext = path.extname(file).toLowerCase();
          if (![".ttf", ".otf", ".woff", ".woff2"].includes(ext)) {
            continue;
          }
          let fontName = path.basename(file, ext).toLowerCase();
          fontName = fontName.replace(/[-_\d]/g, "").trim();
          const mappedName = Object.keys(fontMappings).find((key) =>
            fontName.startsWith(key.toLowerCase())
          );
          if (mappedName) {
            fonts.add(fontMappings[mappedName]);
          } else if (fontName.length > 2) {
            fonts.add(fontName.charAt(0).toUpperCase() + fontName.slice(1));
          }
        }
      } catch (error) {
        console.error(`Could not read font directory: ${fontDir}`, error);
      }
    }

    return Array.from(fonts).sort();
  }

  static getMacFonts(): string[] {
    const fonts: string[] = [];
    const fontDirs = [
      "/System/Library/Fonts",
      "/Library/Fonts",
      path.join(os.homedir(), "Library/Fonts"),
    ];

    for (const fontDir of fontDirs) {
      try {
        if (!fs.existsSync(fontDir)) {
          continue;
        }
        for (const file of fs.readdirSync(fontDir)) {
          const lower = file.toLowerCase();
          if (
            !lower.endsWith(".ttf") &&
            !lower.endsWith(".otf") &&
            !lower.endsWith(".ttc")
          ) {
            continue;
          }
          const fontName = path
            .basename(file, path.extname(file))
            .replace(/[-_].*$/, "")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          if (!fonts.includes(fontName) && fontName.length > 2) {
            fonts.push(fontName);
          }
        }
      } catch (error) {
        console.error(`Could not read font directory: ${fontDir}`, error);
      }
    }

    return fonts.sort();
  }

  static getLinuxFonts(): string[] {
    const fonts: string[] = [];
    const fontDirs = [
      "/usr/share/fonts",
      "/usr/local/share/fonts",
      path.join(os.homedir(), ".fonts"),
      path.join(os.homedir(), ".local/share/fonts"),
    ];

    const scanDir = (dir: string): void => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          scanDir(fullPath);
          continue;
        }
        const ext = path.extname(item.name).toLowerCase();
        if (![".ttf", ".otf", ".woff", ".woff2", ".pfb", ".pfa"].includes(ext)) {
          continue;
        }
        const fontName = path
          .basename(item.name, ext)
          .replace(/[-_].*$/, "")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        if (!fonts.includes(fontName) && fontName.length > 2) {
          fonts.push(fontName);
        }
      }
    };

    for (const fontDir of fontDirs) {
      try {
        if (fs.existsSync(fontDir)) {
          scanDir(fontDir);
        }
      } catch (error) {
        console.error(`Could not read font directory: ${fontDir}`, error);
      }
    }

    return fonts.sort();
  }

  static getSystemFonts(): string[] {
    try {
      switch (os.platform()) {
        case "win32":
          return this.getWindowsFonts();
        case "darwin":
          return this.getMacFonts();
        case "linux":
          return this.getLinuxFonts();
        default:
          return [];
      }
    } catch (error) {
      console.error("Error detecting system fonts:", error);
      return [];
    }
  }

  static getAllAvailableFonts(): Record<string, string[]> {
    const systemFonts = this.getSystemFonts();
    const categories: Record<string, string[]> = {
      inherit: ["inherit"],
      "Programming Fonts": [
        "Fira Code, 'Courier New', monospace",
        "JetBrains Mono, 'Courier New', monospace",
        "Source Code Pro, 'Courier New', monospace",
        "Consolas, 'Courier New', monospace",
        "Cascadia Code, 'Courier New', monospace",
        "SF Mono, Monaco, 'Courier New', monospace",
        "Roboto Mono, 'Courier New', monospace",
        "Ubuntu Mono, 'Courier New', monospace",
        "Inconsolata, 'Courier New', monospace",
        "Monaco, 'Courier New', monospace",
        "Menlo, 'Courier New', monospace",
        "Hack, 'Courier New', monospace",
        "Anonymous Pro, 'Courier New', monospace",
        "DejaVu Sans Mono, 'Courier New', monospace",
        "Liberation Mono, 'Courier New', monospace",
        "Noto Sans Mono, 'Courier New', monospace",
        "PT Mono, 'Courier New', monospace",
        "IBM Plex Mono, 'Courier New', monospace",
        "Victor Mono, 'Courier New', monospace",
        "Input Mono, 'Courier New', monospace",
        "Operator Mono, 'Courier New', monospace",
        "Fantasque Sans Mono, 'Courier New', monospace",
        "Droid Sans Mono, 'Courier New', monospace",
        "Lucida Console, Monaco, monospace",
        "Courier New, Courier, monospace",
      ],
      "System Fonts": [
        "Arial, sans-serif",
        "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
        "Helvetica Neue, Helvetica, Arial, sans-serif",
        "Calibri, sans-serif",
        "Tahoma, Geneva, sans-serif",
        "Verdana, Geneva, sans-serif",
        "Trebuchet MS, 'Lucida Grande', sans-serif",
        "Candara, sans-serif",
        "Corbel, sans-serif",
      ],
      "Serif Fonts": [
        "Times New Roman, Times, serif",
        "Georgia, 'Times New Roman', serif",
        "Cambria, serif",
        "Constantia, serif",
      ],
      "Display Fonts": [
        "Impact, Arial Black, sans-serif",
        "Arial Black, Arial, sans-serif",
      ],
    };

    for (const font of systemFonts) {
      if (!categories["System Fonts"].some((existing) => existing.includes(font))) {
        categories["System Fonts"].push(`${font}, sans-serif`);
      }
    }

    return categories;
  }
}
