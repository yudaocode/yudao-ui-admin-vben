import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmMaterialStockApi {
  /** MES 库存台账 */
  export interface MaterialStock {
    id?: number; // 编号
    itemTypeId?: number; // 物料分类编号
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 计量单位名称
    batchId?: number; // 批次编号
    batchCode?: string; // 批次号
    warehouseId?: number; // 仓库编号
    warehouseCode?: string; // 仓库编码
    warehouseName?: string; // 仓库名称
    locationId?: number; // 库区编号
    locationName?: string; // 库区名称
    areaId?: number; // 库位编号
    areaName?: string; // 库位名称
    vendorId?: number; // 供应商编号
    vendorName?: string; // 供应商名称
    quantity?: number; // 在库数量
    receiptTime?: string; // 入库日期
    frozen?: boolean; // 是否冻结
    createTime?: Date; // 创建时间
  }
}

/** 查询库存台账分页 */
export function getMaterialStockPage(params: PageParam) {
  return requestClient.get<PageResult<MesWmMaterialStockApi.MaterialStock>>(
    '/mes/wm/material-stock/page',
    { params },
  );
}

/** 查询库存台账详情 */
export function getMaterialStock(id: number) {
  return requestClient.get<MesWmMaterialStockApi.MaterialStock>(
    `/mes/wm/material-stock/get?id=${id}`,
  );
}

/** 更新库存冻结状态 */
export function updateMaterialStockFrozen(data: {
  frozen: boolean;
  id: number;
}) {
  return requestClient.put('/mes/wm/material-stock/update-frozen', data);
}

/** 导出库存台账 */
export function exportMaterialStock(params: any) {
  return requestClient.download('/mes/wm/material-stock/export-excel', {
    params,
  });
}
