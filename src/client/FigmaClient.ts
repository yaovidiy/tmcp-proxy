const FIGMA_BASE_URL = "https://api.figma.com";

export class FigmaClient {
  private get token(): string {
    const t = process.env.FIGMA_API_TOKEN;
    if (!t) throw new Error("FIGMA_API_TOKEN environment variable is not set");
    return t;
  }

  private async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${FIGMA_BASE_URL}${endpoint}`, {
      headers: {
        "X-Figma-Token": this.token,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Figma API error: ${response.status} ${response.statusText}`,
      );
    }

    const json = await response.clone().json().catch(() => null);

    console.error(`Figma API GET ${endpoint} - Status: ${response.status}`, json);

    return response.json() as Promise<T>;
  }

  /**
   * Returns all published styles in a file.
   * Each style entry contains a node_id referencing the actual style node.
   */
  getFileStyles(fileKey: string): Promise<FigmaStylesResponse> {
    return this.get<FigmaStylesResponse>(`/v1/files/${fileKey}/styles`);
  }

  /**
   * Fetches node data for a batch of node IDs from a file.
   * Used to resolve actual fill/text/effect values from style node IDs.
   */
  getNodes(fileKey: string, nodeIds: string[]): Promise<FigmaNodesResponse> {
    const ids = nodeIds.join(",");
    return this.get<FigmaNodesResponse>(
      `/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(ids)}`,
    );
  }

  /**
   * Returns all published components and component sets in a file.
   */
  getComponents(fileKey: string): Promise<FigmaComponentsResponse> {
    return this.get<FigmaComponentsResponse>(
      `/v1/files/${fileKey}/components`,
    );
  }

  /**
   * Returns local variable collections and variables for a file.
   */
  getVariables(fileKey: string): Promise<FigmaVariablesResponse> {
    return this.get<FigmaVariablesResponse>(
      `/v1/files/${fileKey}/variables/local`,
    );
  }
}

export const figmaClient = new FigmaClient();

// ─── Figma API response types ────────────────────────────────────────────────

export interface FigmaStyleMeta {
  key: string;
  name: string;
  style_type: "FILL" | "TEXT" | "EFFECT" | "GRID";
  node_id: string;
  description: string;
}

export interface FigmaStylesResponse {
  error: boolean;
  status: number;
  meta: {
    styles: FigmaStyleMeta[];
  };
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaPaint {
  type: string;
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  gradientStops?: { color: FigmaColor; position: number }[];
}

export interface FigmaTypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  fontStyle?: string;
  fontWeight: number;
  fontSize: number;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
  letterSpacing: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  lineHeightUnit?: string;
}

export interface FigmaEffect {
  type: string;
  visible: boolean;
  radius: number;
  color?: FigmaColor;
  offset?: { x: number; y: number };
  spread?: number;
}

export interface FigmaLayoutGrid {
  pattern: string;
  sectionSize: number;
  visible: boolean;
  color: FigmaColor;
  alignment?: string;
  gutterSize?: number;
  offset?: number;
  count?: number;
}

export interface FigmaNode {
  document: {
    id: string;
    name: string;
    type: string;
    fills?: FigmaPaint[];
    style?: FigmaTypeStyle;
    effects?: FigmaEffect[];
    layoutGrids?: FigmaLayoutGrid[];
  };
}

export interface FigmaNodesResponse {
  error: boolean;
  status: number;
  nodes: Record<string, FigmaNode | null>;
}

export interface FigmaComponentMeta {
  key: string;
  name: string;
  description: string;
  node_id: string;
  containing_frame?: {
    name: string;
    node_id: string;
    page_id: string;
    page_name: string;
  };
}

export interface FigmaComponentsResponse {
  error: boolean;
  status: number;
  meta: {
    components: FigmaComponentMeta[];
  };
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  modes: { modeId: string; name: string }[];
  defaultModeId: string;
  remote: boolean;
}

export interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
  valuesByMode: Record<string, unknown>;
  description?: string;
}

export interface FigmaVariablesResponse {
  error: boolean;
  status: number;
  meta: {
    variableCollections: Record<string, FigmaVariableCollection>;
    variables: Record<string, FigmaVariable>;
  };
}
