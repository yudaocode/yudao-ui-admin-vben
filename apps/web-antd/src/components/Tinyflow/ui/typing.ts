import { Edge, Node as Node_2, useSvelteFlow, Viewport } from '@xyflow/svelte';

export declare type Item = {
  children?: Item[];
  label: string;
  value: number | string;
};

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
    nodes: Node_2[];
    viewport: Viewport;
  };
  getOptions(): TinyflowOptions;
  setData(data: TinyflowData): void;
}

export declare type TinyflowData = Partial<
  ReturnType<ReturnType<typeof useSvelteFlow>['toObject']>
>;

export declare type TinyflowOptions = {
  data?: TinyflowData;
  element: Element | string;
  provider?: {
    internal?: () => Item[] | Promise<Item[]>;
    knowledge?: () => Item[] | Promise<Item[]>;
    llm?: () => Item[] | Promise<Item[]>;
  };
};

export {};
