import { useAppConfig } from '@vben/hooks';
import { fetchEventSource } from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { requestClient } from '#/api/request';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
const accessStore = useAccessStore();

export namespace AiMindmapApi {
  export interface MindMap {
    id: number; // 编号
    userId: number; // 用户编号
    prompt: string; // 生成内容提示
    generatedContent: string; // 生成的思维导图内容
    platform: string; // 平台
    model: string; // 模型
    errorMessage: string; // 错误信息
    inputTokens?: null | number; // 输入 Token，未知为 null
    outputTokens?: null | number; // 输出 Token，未知为 null
    totalTokens?: null | number; // 合计 Token，未知为 null
  }

  export interface AiMindMapGenerateReqVO {
    prompt: string;
  }

  /** 思维导图生成的 Stream 响应 */
  export interface MindMapGenerateResp {
    id: number; // 思维导图编号
    content: string; // 本次增量内容
    inputTokens: null | number; // 输入 Token，未知为 null
    outputTokens: null | number; // 输出 Token，未知为 null
    totalTokens: null | number; // 合计 Token，未知为 null
  }
}

/** 生成思维导图 Stream */
export function generateMindMap({
  data,
  onClose,
  onMessage,
  onError,
  ctrl,
}: {
  ctrl: AbortController;
  data: AiMindmapApi.AiMindMapGenerateReqVO;
  onClose?: (...args: any[]) => void;
  onError?: (...args: any[]) => void;
  onMessage?: (res: any) => void;
}) {
  const token = accessStore.accessToken;
  return fetchEventSource(`${apiURL}/ai/mind-map/generate-stream`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    openWhenHidden: true,
    body: JSON.stringify(data),
    onmessage: onMessage,
    onerror: onError,
    onclose: onClose,
    signal: ctrl.signal,
  });
}

/** 查询思维导图分页 */
export function getMindMapPage(params: any) {
  return requestClient.get(`/ai/mind-map/page`, { params });
}

/** 删除思维导图 */
export function deleteMindMap(id: number) {
  return requestClient.delete(`/ai/mind-map/delete?id=${id}`);
}
