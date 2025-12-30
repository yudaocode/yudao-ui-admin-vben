import type { Dayjs } from 'dayjs';

import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PaymentApi {
  /** 助理信息 */
  export interface Payment {
    id: number; // 编号
    amount?: number; // 金额
    name?: string; // 助理名称
    billingType: string; // 帐单类型
    startTime: Dayjs | string; // 开始时间
    endTime: Dayjs | string; // 结束时间
    autoRenew: boolean; // 是否自动续期
    status: number; // 状态
    remark: string; // 备注
    configStep: number; // 步骤
  }
}
/** 查询助理：详情和配置 */
export function getAssistantInfo(id: number) {
  return requestClient.get<AssistantApi.AssistantInfo>(
    `/mpr/assistant/getInfo?id=${id}`,
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
export function getCheckoutSession(id: string) {
  return requestClient.get(`/mpr/payment/get-checkout-session?sessionId=${id}`);
}

/** 生成付款意图 */
export function createPaymentIntent(data: PaymentApi.Payment) {
  return requestClient.post('/mpr/payment/create-payment-intent', data);
}
/** 生成付款意图 */
export function createCheckout(data: PaymentApi.Payment) {
  return requestClient.post('/mpr/payment/create-checkout-session', data);
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
