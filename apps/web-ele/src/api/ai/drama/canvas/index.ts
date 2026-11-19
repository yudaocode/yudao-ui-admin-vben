import { requestClient } from '#/api/request';

export namespace AiDramaCanvasApi {
  /** 画布文档：节点、连线；预演节点打开 3D 导演 */
  export interface CanvasDocument {
    schema: 1;
    nodes: {
      data: Record<string, any>;
      id: string;
      // 画布节点类型，存在画布 JSON 文档里，后端按字符串集合校验；与视觉资产的整数 kind 是两套
      kind: 'audio' | 'group' | 'image' | 'previs' | 'script' | 'text' | 'video';
      parentId?: string;
      position: { x: number; y: number };
    }[];
    edges: { id: string; source: string; target: string }[];
    viewport?: { x: number; y: number; zoom: number };
  }

  /** 画布、3D 导演工程：revision 为 0 表示还没有保存过 */
  export interface Canvas<T = any> {
    revision: number;
    document?: T;
  }

  /** 保存画布 Request */
  export interface CanvasSaveReq {
    projectId: number;
    revision: number;
    document: CanvasDocument;
  }

  /** 保存 3D 导演 Request */
  export interface DirectorSaveReq {
    projectId: number;
    nodeId: string;
    revision: number;
    document: any;
  }
}

/** 获得画布 */
export function getDramaCanvas(projectId: number) {
  return requestClient.get<AiDramaCanvasApi.Canvas<AiDramaCanvasApi.CanvasDocument>>(
    `/ai/drama/canvas/get?projectId=${projectId}`,
  );
}

/** 保存画布：返回新的修订号；修订号不一致时报错 */
export function saveDramaCanvas(data: AiDramaCanvasApi.CanvasSaveReq) {
  return requestClient.put<number>('/ai/drama/canvas/save', data);
}

/** 获得 3D 导演工程 */
export function getDramaDirector(projectId: number, nodeId: string) {
  return requestClient.get<AiDramaCanvasApi.Canvas>(
    `/ai/drama/canvas/get-director?projectId=${projectId}&nodeId=${encodeURIComponent(nodeId)}`,
  );
}

/** 保存 3D 导演工程：返回新的修订号 */
export function saveDramaDirector(data: AiDramaCanvasApi.DirectorSaveReq) {
  return requestClient.put<number>('/ai/drama/canvas/save-director', data);
}
