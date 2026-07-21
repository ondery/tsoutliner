/** Supported outline node kinds */
export type OutlineNodeType =
  | "class"
  | "interface"
  | "constructor"
  | "property"
  | "method"
  | "function"
  | "getter"
  | "setter"
  | "variable"
  | "constant"
  | "enum"
  | "enumMember"
  | "module"
  | "namespace"
  | "typeAlias"
  | "heading"
  | "file"
  | "object"
  | "array"
  | "key"
  | "event"
  | "operator"
  | "typeParameter";

export type Visibility = "public" | "private" | "protected" | "none";

export type Modifier =
  | "static"
  | "readonly"
  | "abstract"
  | "async"
  | "export"
  | "default";

export type SortMode = "position" | "name" | "category";

export interface OutlineNode {
  name: string;
  type: OutlineNodeType;
  visibility: Visibility;
  modifiers: Modifier[];
  line: number;
  children?: OutlineNode[];
}

export const CONFIG_SECTION = "tsOutlineEnhancer";

export const EXTENSION_ID = "ondery.tsoutliner";
