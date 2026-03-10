import type {
  FigmaColor,
  FigmaStyleMeta,
  FigmaNodesResponse,
  FigmaComponentsResponse,
  FigmaVariablesResponse,
} from "../../client/FigmaClient";

// ─── Color helpers ────────────────────────────────────────────────────────────

function toHex(c: FigmaColor): string {
  const r = Math.round(c.r * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round(c.g * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round(c.b * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${r}${g}${b}`;
}

function toRgba(c: FigmaColor): string {
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${Math.round(c.a * 100) / 100})`;
}

// ─── Parsed output types ──────────────────────────────────────────────────────

export interface ParsedColorStyle {
  key: string;
  name: string;
  description: string;
  hex: string;
  rgba: string;
  opacity: number;
  paint_type: string;
}

export interface ParsedTypographyStyle {
  key: string;
  name: string;
  description: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  fontStyle?: string;
  letterSpacing: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  lineHeightUnit?: string;
  textAlignHorizontal?: string;
}

export interface ParsedEffectStyle {
  key: string;
  name: string;
  description: string;
  effects: {
    type: string;
    visible: boolean;
    radius: number;
    spread?: number;
    color?: { hex: string; rgba: string };
    offset?: { x: number; y: number };
  }[];
}

export interface ParsedGridStyle {
  key: string;
  name: string;
  description: string;
  grids: {
    pattern: string;
    sectionSize: number;
    visible: boolean;
    color: { hex: string; rgba: string };
    alignment?: string;
    gutterSize?: number;
    offset?: number;
    count?: number;
  }[];
}

export interface ParsedStyles {
  colors: ParsedColorStyle[];
  typography: ParsedTypographyStyle[];
  effects: ParsedEffectStyle[];
  grids: ParsedGridStyle[];
}

export interface ParsedComponent {
  key: string;
  name: string;
  description: string;
  node_id: string;
  frame_name?: string;
  page_name?: string;
}

export interface ParsedComponents {
  components: ParsedComponent[];
}

export interface ParsedVariable {
  id: string;
  name: string;
  type: string;
  collection: string;
  description?: string;
  valuesByMode: Record<string, unknown>;
}

export interface ParsedVariableCollection {
  id: string;
  name: string;
  modes: { modeId: string; name: string }[];
  defaultModeId: string;
}

export interface ParsedVariables {
  collections: ParsedVariableCollection[];
  variables: ParsedVariable[];
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

export function parseFigmaStyles(
  styles: FigmaStyleMeta[],
  nodesResponse: FigmaNodesResponse,
): ParsedStyles {
  const result: ParsedStyles = {
    colors: [],
    typography: [],
    effects: [],
    grids: [],
  };

  for (const style of styles) {
    const nodeWrapper = nodesResponse.nodes[style.node_id];
    if (!nodeWrapper) continue;

    const doc = nodeWrapper.document;
    const base = {
      key: style.key,
      name: style.name,
      description: style.description,
    };

    if (style.style_type === "FILL") {
      const fill = doc.fills?.[0];
      if (fill?.color) {
        result.colors.push({
          ...base,
          hex: toHex(fill.color),
          rgba: toRgba(fill.color),
          opacity: fill.opacity ?? fill.color.a ?? 1,
          paint_type: fill.type,
        });
      }
    } else if (style.style_type === "TEXT") {
      const s = doc.style;
      if (s) {
        result.typography.push({
          ...base,
          fontFamily: s.fontFamily,
          fontWeight: s.fontWeight,
          fontSize: s.fontSize,
          fontStyle: s.fontStyle,
          letterSpacing: s.letterSpacing,
          lineHeightPx: s.lineHeightPx,
          lineHeightPercent: s.lineHeightPercent,
          lineHeightUnit: s.lineHeightUnit,
          textAlignHorizontal: s.textAlignHorizontal,
        });
      }
    } else if (style.style_type === "EFFECT") {
      result.effects.push({
        ...base,
        effects: (doc.effects ?? []).map((e) => ({
          type: e.type,
          visible: e.visible,
          radius: e.radius,
          spread: e.spread,
          color: e.color
            ? { hex: toHex(e.color), rgba: toRgba(e.color) }
            : undefined,
          offset: e.offset,
        })),
      });
    } else if (style.style_type === "GRID") {
      result.grids.push({
        ...base,
        grids: (doc.layoutGrids ?? []).map((g) => ({
          pattern: g.pattern,
          sectionSize: g.sectionSize,
          visible: g.visible,
          color: { hex: toHex(g.color), rgba: toRgba(g.color) },
          alignment: g.alignment,
          gutterSize: g.gutterSize,
          offset: g.offset,
          count: g.count,
        })),
      });
    }
  }

  return result;
}

export function parseFigmaComponents(
  response: FigmaComponentsResponse,
): ParsedComponents {
  return {
    components: response.meta.components.map((c) => ({
      key: c.key,
      name: c.name,
      description: c.description,
      node_id: c.node_id,
      frame_name: c.containing_frame?.name,
      page_name: c.containing_frame?.page_name,
    })),
  };
}

export function parseFigmaVariables(
  response: FigmaVariablesResponse,
): ParsedVariables {
  const collectionsMap = response.meta.variableCollections;
  const variablesMap = response.meta.variables;

  const collections: ParsedVariableCollection[] = Object.values(
    collectionsMap,
  ).map((col) => ({
    id: col.id,
    name: col.name,
    modes: col.modes,
    defaultModeId: col.defaultModeId,
  }));

  const variables: ParsedVariable[] = Object.values(variablesMap).map(
    (variable) => ({
      id: variable.id,
      name: variable.name,
      type: variable.resolvedType,
      collection:
        collectionsMap[variable.variableCollectionId]?.name ??
        variable.variableCollectionId,
      description: variable.description,
      valuesByMode: variable.valuesByMode,
    }),
  );

  return { collections, variables };
}
