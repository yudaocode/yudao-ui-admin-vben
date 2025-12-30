import type { Dayjs } from 'dayjs';

import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OrderApi {
  /** 账单记录信息 */
  export interface Order {
    id: number; // 订单编号
    userId?: number; // 用户编号
    objectType: string; // 对象类型
    objectId: number; // 对象编号
    objectName: string; // 对象名称
    billingType: string; // 帐单类型
    billingMode: string; // 账单模式
    price?: number; // 价格
    quantity: number; // 数量
    currency: string; // 货币
    payStatus?: boolean; // 是否已支付
    payOrderId: number; // 支付订单编号
    payChannelCode: string; // 支付成功的支付渠道
    payTime: Dayjs | string; // 订单支付时间
    payRefundId: number; // 退款订单编号
    refundPrice?: number; // 退款金额
    refundTime: Dayjs | string; // 退款时间
    transferChannelPackageInfo: string; // 渠道 package 信息
    sessionId: string; // 结账会话编号
    synced: number; // 是否已同步到助手
  }
}

/** 查询账单记录分页 */
export function getOrderPage(params: PageParam) {
  return requestClient.get<PageResult<OrderApi.Order>>('/mpr/order/page', {
    params,
  });
}

/** 查询账单记录详情 */
export function getOrder(id: number) {
  return requestClient.get<OrderApi.Order>(`/mpr/order/get?id=${id}`);
}

/** 新增账单记录 */
export function createOrder(data: OrderApi.Order) {
  return requestClient.post('/mpr/order/create', data);
}

/** 修改账单记录 */
export function updateOrder(data: OrderApi.Order) {
  return requestClient.put('/mpr/order/update', data);
}

/** 删除账单记录 */
export function deleteOrder(id: number) {
  return requestClient.delete(`/mpr/order/delete?id=${id}`);
}

/** 批量删除账单记录 */
export function deleteOrderList(ids: number[]) {
  return requestClient.delete(`/mpr/order/delete-list?ids=${ids.join(',')}`);
}

/** 导出账单记录 */
export function exportOrder(params: any) {
  return requestClient.download('/mpr/order/export-excel', params);
}
