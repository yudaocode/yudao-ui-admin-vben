import type { AiDramaStoryboardApi } from '#/api/ai/drama/storyboard';

import { useAppConfig } from '@vben/hooks';
import { fetchEventSource } from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { requestClient } from '#/api/request';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
const accessStore = useAccessStore();

/** 同步调用模型生成，超时时间放宽到 5 分钟 */
const GENERATE_TIMEOUT = 5 * 60 * 1000;

export namespace AiDramaScriptApi {
  /** AI 短剧剧本 */
  export interface Script {
    id: number;
    projectId: number;
    title?: string;
    tone?: string; // 叙事基调
    outline?: string;
    content?: string;
    source?: number; // 来源，参见 AiDramaScriptSourceEnum
    creationMode?: number; // 创作模式，参见 AiDramaScriptCreationModeEnum
    sourceMaterial?: string; // 原始素材
    worldbuilding?: string; // 世界观设定
    revisionNote?: string; // 本版本的修改说明
    createTime?: Date;
  }

  /** 保存剧本 Request：指定编号时更新该版本，未指定时新增版本 */
  export interface UpdateReq {
    id?: number;
    projectId: number;
    title?: string;
    tone?: string;
    outline?: string;
    content?: string;
    creationMode?: number;
    sourceMaterial?: string;
    worldbuilding?: string;
    revisionNote?: string;
  }

  /** 从故事想法创建项目 Request：项目设置与故事想法；名称为空时使用生成的剧名 */
  export interface CreateReq {
    name?: string;
    description?: string;
    idea: string;
    style?: number;
    aestheticSkillId?: number;
    directorSkillId?: number;
    storyboardSkillIds?: number[];
    composeAspectRatio?: string;
    modelId?: number;
  }

  /** 导入审阅后的分镜 Request */
  export interface ImportStoryboardReq {
    projectId: number;
    scriptId: number;
    storyboards: AiDramaStoryboardApi.SaveReq[];
  }
}

/** 保存剧本：指定编号时更新该版本，未指定时新增版本；返回剧本编号 */
export function updateDramaScript(data: AiDramaScriptApi.UpdateReq) {
  return requestClient.put<number>('/ai/drama/script/update', data);
}

/** 获得剧本列表 */
export function getDramaScriptList(projectId: number) {
  return requestClient.get<AiDramaScriptApi.Script[]>(
    `/ai/drama/script/list?projectId=${projectId}`,
  );
}

/** 生成剧本 */
export function generateDramaScript(projectId: number, modelId?: number) {
  return requestClient.post<AiDramaScriptApi.Script>(
    '/ai/drama/script/generate',
    { projectId, modelId },
    { timeout: GENERATE_TIMEOUT },
  );
}

/** 润色剧本 */
export function polishDramaScript(
  projectId: number,
  note: string,
  modelId?: number,
) {
  return requestClient.post<AiDramaScriptApi.Script>(
    '/ai/drama/script/polish',
    { projectId, note, modelId },
    { timeout: GENERATE_TIMEOUT },
  );
}

/** 分析资产清单 */
export function analyzeDramaAssetList(projectId: number, modelId?: number) {
  return requestClient.post<boolean>(
    '/ai/drama/script/analyze-asset-list',
    { projectId, modelId },
    { timeout: GENERATE_TIMEOUT },
  );
}

/** 生成分镜列表 */
export function generateDramaStoryboardList(
  projectId: number,
  modelId?: number,
) {
  return requestClient.post<boolean>(
    '/ai/drama/script/generate-storyboard-list',
    { projectId, modelId },
    { timeout: GENERATE_TIMEOUT },
  );
}

/** 规划分镜：只返回不保存，审阅后导入 */
export function planDramaStoryboardList(projectId: number, modelId?: number) {
  return requestClient.post<AiDramaStoryboardApi.Storyboard[]>(
    '/ai/drama/script/plan-storyboard-list',
    { projectId, modelId },
    { timeout: GENERATE_TIMEOUT },
  );
}

/** 导入审阅后的分镜：替换当前剧本的分镜 */
export function importDramaStoryboardList(
  data: AiDramaScriptApi.ImportStoryboardReq,
) {
  return requestClient.post<boolean>(
    '/ai/drama/script/import-storyboard-list',
    data,
  );
}

/** 生成摄影规则 */
export function generateDramaPhotographyRules(
  projectId: number,
  modelId?: number,
) {
  return requestClient.post<boolean>(
    '/ai/drama/script/generate-photography-rules',
    { projectId, modelId },
    { timeout: GENERATE_TIMEOUT },
  );
}

/** 生成表演指导 */
export function generateDramaActingNotes(projectId: number, modelId?: number) {
  return requestClient.post<boolean>(
    '/ai/drama/script/generate-acting-notes',
    { projectId, modelId },
    { timeout: GENERATE_TIMEOUT },
  );
}

/** 规划关键帧：生成关键帧画面描述与画面焦点 */
export function planDramaFrameList(projectId: number, modelId?: number) {
  return requestClient.post<boolean>(
    '/ai/drama/script/plan-frame-list',
    { projectId, modelId },
    { timeout: GENERATE_TIMEOUT },
  );
}

/** 从故事想法创建项目：流式生成初版剧本；data 生成中为增量文本 content，最后一条为项目编号 projectId */
export function createDramaProjectStream({
  data,
  onMessage,
  onError,
  onClose,
  ctrl,
}: {
  ctrl: AbortController;
  data: AiDramaScriptApi.CreateReq;
  onClose?: (...args: any[]) => void;
  onError?: (...args: any[]) => void;
  onMessage?: (res: any) => void;
}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessStore.accessToken) {
    headers.Authorization = `Bearer ${accessStore.accessToken}`;
  }
  if (accessStore.tenantId) {
    headers['tenant-id'] = String(accessStore.tenantId);
  }
  if (accessStore.accessToken && accessStore.visitTenantId) {
    headers['visit-tenant-id'] = String(accessStore.visitTenantId);
  }
  return fetchEventSource(`${apiURL}/ai/drama/script/create-stream`, {
    method: 'post',
    headers,
    openWhenHidden: true,
    body: JSON.stringify(data),
    onmessage: onMessage,
    onerror: onError,
    onclose: onClose,
    signal: ctrl.signal,
  });
}
