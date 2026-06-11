import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmProductProduceLineApi {
  /** MES 产品产出行 */
  export interface ProductProduceLine {
    id?: number;
    feedbackId?: number; // 报工编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物资编码
    itemName?: string; // 物资名称
    specification?: string; // 规格型号
    unitMeasureId?: number; // 单位编号
    unitMeasureName?: string; // 单位
    quantity?: number; // 产出数量
    batchCode?: string; // 批次号
    qualityStatus?: number; // 质量状态
    locationId?: number; // 库位编号
    locationName?: string; // 库位名称
    remark?: string; // 备注
  }

  /** MES 产品产出行分页查询参数 */
  export interface PageParams extends PageParam {
    feedbackId?: number;
  }
}

/** 查询产品产出行分页 */
export function getProductProduceLinePage(
  params: MesWmProductProduceLineApi.PageParams,
) {
  return requestClient.get<
    PageResult<MesWmProductProduceLineApi.ProductProduceLine>
  >('/mes/wm/product-produce-line/page', { params });
}
