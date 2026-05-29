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
