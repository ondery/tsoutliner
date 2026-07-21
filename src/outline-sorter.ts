import { OutlineNode, OutlineNodeType, SortMode } from "./types";

/**
 * Sorts outline nodes by position, name, or category (recursively).
 */
export class OutlineSorter {
  static sortNodes(nodes: OutlineNode[], sortMode: SortMode): OutlineNode[] {
    const sortedNodes = this.deepCopyNodes(nodes);
    this.applySortRecursive(sortedNodes, sortMode);
    return sortedNodes;
  }

  private static deepCopyNodes(nodes: OutlineNode[]): OutlineNode[] {
    return nodes.map((node) => ({
      ...node,
      children: node.children ? this.deepCopyNodes(node.children) : [],
    }));
  }

  private static applySortRecursive(
    nodes: OutlineNode[],
    sortMode: SortMode
  ): void {
    switch (sortMode) {
      case "name":
        this.sortByName(nodes);
        break;
      case "category":
        this.sortByCategory(nodes);
        break;
      case "position":
      default:
        this.sortByPosition(nodes);
        break;
    }

    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        this.applySortRecursive(node.children, sortMode);
      }
    }
  }

  private static sortByPosition(nodes: OutlineNode[]): void {
    nodes.sort((a, b) => a.line - b.line);
  }

  private static sortByName(nodes: OutlineNode[]): void {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
  }

  private static sortByCategory(nodes: OutlineNode[]): void {
    const categoryOrder = this.getCategoryOrder();
    nodes.sort((a, b) => {
      const aCategory = categoryOrder[a.type] ?? 999;
      const bCategory = categoryOrder[b.type] ?? 999;
      if (aCategory !== bCategory) {
        return aCategory - bCategory;
      }
      return a.name.localeCompare(b.name);
    });
  }

  private static getCategoryOrder(): Record<OutlineNodeType, number> {
    return {
      file: 0,
      module: 1,
      namespace: 2,
      class: 3,
      interface: 4,
      typeAlias: 5,
      enum: 6,
      enumMember: 7,
      object: 8,
      array: 9,
      key: 10,
      constructor: 11,
      property: 12,
      getter: 13,
      setter: 14,
      method: 15,
      function: 16,
      variable: 17,
      constant: 18,
      heading: 19,
      event: 20,
      operator: 21,
      typeParameter: 22,
    };
  }
}
