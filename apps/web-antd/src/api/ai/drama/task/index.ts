import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace AiDramaTaskApi {
  /** AI 短剧生成任务 */
  export interface Task {
    type: number; // 任务类型，参见 ai_drama_task_type 字典
    id: number;
    projectId: number;
    projectName?: string;
    userId?: number;
    userNickname?: string;
    title?: string;
    status: number;
    errorMessage?: string;
    prompt?: string;
    modelId?: number;
    taskId?: string;
    resultUrl?: string;
    timeout?: boolean; // 是否已超时
    createTime?: Date;
    updateTime?: Date;
  }
}

/** 获得生成任务分页 */
export function getDramaTaskPage(params: PageParam) {
  return requestClient.get<PageResult<AiDramaTaskApi.Task>>(
    '/ai/drama/task/page',
    { params },
  );
}

/** 重新提交任务 */
export function resubmitDramaTask(type: number, id: number) {
  return requestClient.put<boolean>('/ai/drama/task/resubmit', { type, id });
}

/** 同步任务状态 */
export function syncDramaTask(type: number, id: number) {
  return requestClient.put<boolean>('/ai/drama/task/sync', { type, id });
}

/** 标记任务失败 */
export function updateDramaTaskFail(type: number, id: number) {
  return requestClient.put<boolean>('/ai/drama/task/update-fail', { type, id });
}
