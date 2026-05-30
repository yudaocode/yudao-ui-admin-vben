import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesProCardApi {
  /** MES 生产流转卡 */
  export interface Card {
    id?: number; // 编号
    code?: string; // 流转卡编码
    workOrderId?: number; // 生产工单编号
    workOrderCode?: string; // 工单编码
    workOrderName?: string; // 工单名称
    batchCode?: string; // 批次号
    itemId?: number; // 产品物料编号
    itemCode?: string; // 产品编码
    itemName?: string; // 产品名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 单位名称
    transferedQuantity?: number; // 流转数量
    status?: number; // 状态
    remark?: string; // 备注
  }

  /** MES 生产流转卡分页查询参数 */
  export interface PageParams extends PageParam {
    code?: string;
    workOrderId?: number;
    itemId?: number;
    batchCode?: string;
  }
}

/** 查询生产流转卡分页 */
export function getCardPage(params: MesProCardApi.PageParams) {
  return requestClient.get<PageResult<MesProCardApi.Card>>(
    '/mes/pro/card/page',
    { params },
  );
}

/** 查询生产流转卡详情 */
export function getCard(id: number) {
  return requestClient.get<MesProCardApi.Card>(`/mes/pro/card/get?id=${id}`);
}

/** 新增生产流转卡 */
export function createCard(data: MesProCardApi.Card) {
  return requestClient.post<number>('/mes/pro/card/create', data);
}

/** 修改生产流转卡 */
export function updateCard(data: MesProCardApi.Card) {
  return requestClient.put('/mes/pro/card/update', data);
}

/** 删除生产流转卡 */
export function deleteCard(id: number) {
  return requestClient.delete(`/mes/pro/card/delete?id=${id}`);
}

/** 导出生产流转卡 */
export function exportCard(params: any) {
  return requestClient.download('/mes/pro/card/export-excel', { params });
}

/** 提交生产流转卡 */
export function submitCard(id: number) {
  return requestClient.put(`/mes/pro/card/submit?id=${id}`);
}

/** 完成生产流转卡 */
export function finishCard(id: number) {
  return requestClient.put(`/mes/pro/card/finish?id=${id}`);
}

/** 取消生产流转卡 */
export function cancelCard(id: number) {
  return requestClient.put(`/mes/pro/card/cancel?id=${id}`);
}
