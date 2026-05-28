import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmItemConsumeLineApi {
  /** MES 物料消耗行 */
  export interface ItemConsumeLine {
    id?: number;
    feedbackId?: number; // 报工编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物资编码
    itemName?: string; // 物资名称
    specification?: string; // 规格型号
    unitId?: number; // 单位编号
    unitName?: string; // 单位
    quantity?: number; // 消耗数量
    batchCode?: string; // 批次号
    locationId?: number; // 库位编号
    locationName?: string; // 库位名称
    remark?: string; // 备注
  }

  /** MES 物料消耗行分页查询参数 */
  export interface PageParams extends PageParam {
    feedbackId?: number;
  }
}

/** 查询物料消耗行分页 */
export function getItemConsumeLinePage(
  params: MesWmItemConsumeLineApi.PageParams,
) {
  return requestClient.get<PageResult<MesWmItemConsumeLineApi.ItemConsumeLine>>(
    '/mes/wm/item-consume-line/page',
    { params },
  );
}
