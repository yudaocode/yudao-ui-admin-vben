import type { Dayjs } from 'dayjs';

import type { PageParam, PageResult } from '@vben/request';

import type { AssistantConfigApi } from '#/api/mpr/assistantConfig';

import { requestClient } from '#/api/request';

export namespace AssistantApi {
  /** 助理信息 */
  export interface Assistant {
    id: number; // 编号
    userId?: number; // 用户ID
    name?: string; // 助理名称
    billingType: string; // 帐单类型
    startTime: Dayjs | string; // 开始时间
    endTime: Dayjs | string; // 结束时间
    autoRenew: boolean; // 是否自动续期
    status: number; // 状态
    remark: string; // 备注
    configStep: number; // 步骤
  }
  export interface AssistantInfo {
    id: number; // 编号
    assistant: Assistant; // 状态
    assistantConfig: AssistantConfigApi.AssistantConfig; // 备注
  }
}
/** 查询助理：详情和配置 */
export function getAssistantInfo(id: number) {
  return requestClient.get<AssistantApi.AssistantInfo>(
    `/mpr/assistant/getInfo?id=${id}`,
  );
}
/** 查询最后一个助理：详情和配置 */
export function getLastAssistant() {
  return requestClient.get<AssistantApi.AssistantInfo>(
    `/mpr/assistant/getLast`,
  );
}

/** 查询助理分页 */
export function getAssistantPage(params: PageParam) {
  return requestClient.get<PageResult<AssistantApi.Assistant>>(
    '/mpr/assistant/page',
    { params },
  );
}

/** 查询助理详情 */
export function getAssistant(id: number) {
  return requestClient.get<AssistantApi.Assistant>(
    `/mpr/assistant/get?id=${id}`,
  );
}

/** 新增助理 */
export function createAssistant(data: AssistantApi.Assistant) {
  return requestClient.post('/mpr/assistant/create', data);
}

/** 新增空白助理 */
export function createEmptyAssistant(data: AssistantApi.Assistant) {
  return requestClient.post('/mpr/assistant/createEmpty', data);
}

/** 修改助理 */
export function updateAssistant(data: AssistantApi.Assistant) {
  return requestClient.put('/mpr/assistant/update', data);
}

/** 删除助理 */
export function deleteAssistant(id: number) {
  return requestClient.delete(`/mpr/assistant/delete?id=${id}`);
}

/** 批量删除助理 */
export function deleteAssistantList(ids: number[]) {
  return requestClient.delete(
    `/mpr/assistant/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出助理 */
export function exportAssistant(params: any) {
  return requestClient.download('/mpr/assistant/export-excel', params);
}

/** 获取助理精简信息列表 */
export function getSimpleAssistantList(assistantId: number) {
  return requestClient.get<AssistantApi.Assistant[]>(
    '/mpr/assistant/simple-list',
    {
      params: {
        assistantId,
      },
    },
  );
}
