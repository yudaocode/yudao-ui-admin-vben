import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace AssistantConfigApi {
  /** 助理配置信息 */
  export interface AssistantConfig {
    id: number; // 编号
    assistantId?: number; // 助理ID
    keywordId: number; // 关键词ID
    keyword: string; // 关键词
    sortBy: string; // 排序
    minPrice: number; // 最小价格
    maxPrice: number; // 最大价格
    itemCondition: string; // Condition
    daysSinceListed: number; // 发布时间
    availability: string; // 有效性
    isTargetFilter: number; // 是否AI筛选目标商品
    aiPrompt: string; // AI提示词
    isAutoSelectIntended: number; // 是否自动选择意向商品
    autoSelectIntendedRule: object; // 自动选择意向商品规则
    isAutoSendMessage: number; // 是否自动发送消息
    messageTemplateId: number; // 消息模板ID
    messageTemplateList: []; // 消息模板ID
    remark: string; // 备注
  }
}

/** 查询助理配置分页 */
export function getAssistantConfigPage(params: PageParam) {
  return requestClient.get<PageResult<AssistantConfigApi.AssistantConfig>>(
    '/mpr/assistantConfig/page',
    { params },
  );
}

/** 查询助理配置详情 */
export function getAssistantConfig(id: number) {
  return requestClient.get<AssistantConfigApi.AssistantConfig>(
    `/mpr/assistantConfig/get?id=${id}`,
  );
}

/** 查询助理配置详情 */
export function getAssistantConfigByAssistantId(assistantId: number) {
  return requestClient.get<AssistantConfigApi.AssistantConfig>(
    `/mpr/assistantConfig/getByAssistantId?assistantId=${assistantId}`,
  );
}

/** 新增助理配置 */
export function createAssistantConfig(
  data: AssistantConfigApi.AssistantConfig,
) {
  return requestClient.post('/mpr/assistantConfig/create', data);
}

/** 修改助理配置 */
export function updateAssistantConfig(
  data: AssistantConfigApi.AssistantConfig,
) {
  return requestClient.put('/mpr/assistantConfig/update', data);
}

/** 删除助理配置 */
export function deleteAssistantConfig(id: number) {
  return requestClient.delete(`/mpr/assistantConfig/delete?id=${id}`);
}

/** 批量删除助理配置 */
export function deleteAssistantConfigList(ids: number[]) {
  return requestClient.delete(
    `/mpr/assistantConfig/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出助理配置 */
export function exportAssistantConfig(params: any) {
  return requestClient.download('/mpr/assistantConfig/export-excel', params);
}
