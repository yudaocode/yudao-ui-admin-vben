export interface Item {
  children?: Item[];
  label: string;
  value: number | string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Node {
  data?: Record<string, any>;
  draggable?: boolean;
  height?: number;
  id: string;
  position: Position;
  selected?: boolean;
  type?: string;
  width?: number;
}

export interface Edge {
  animated?: boolean;
  id: string;
  label?: string;
  source: string;
  target: string;
  type?: string;
}
export type TinyflowData = Partial<{
  edges: Edge[];
  nodes: Node[];
  viewport: Viewport;
}>;

export interface TinyflowOptions {
  data?: TinyflowData;
  element: Element | string;
  provider?: {
    internal?: () => Item[] | Promise<Item[]>;
    knowledge?: () => Item[] | Promise<Item[]>;
    llm?: () => Item[] | Promise<Item[]>;
  };
}

export declare class Tinyflow {
  private _init;
  private _setOptions;
  private options;
  private rootEl;
  private svelteFlowInstance;
  constructor(options: TinyflowOptions);
  destroy(): void;
  getData(): {
    edges: Edge[];
    nodes: Node[];
    viewport: Viewport;
  };
  getOptions(): TinyflowOptions;
  setData(data: TinyflowData): void;
}
