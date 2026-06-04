import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesProWorkOrderBomApi {
  /** MES 生产工单 BOM */
  export interface WorkOrderBom {
    id?: number; // 编号
    workOrderId?: number; // 生产工单编号
    itemId?: number; // BOM 物料编号
    itemName?: string; // 物料名称
    itemCode?: string; // 物料编码
    itemSpecification?: string; // 规格型号
    unitMeasureId?: number; // 单位编号
    unitMeasureName?: string; // 单位名称
    quantity?: number; // 预计使用量
    remark?: string; // 备注
    itemOrProduct?: string; // 物料产品标识
  }

  /** MES 生产工单 BOM 分页查询参数 */
  export interface PageParams extends PageParam {
    workOrderId?: number;
  }
}

/** 查询工单 BOM 分页 */
export function getWorkOrderBomPage(params: MesProWorkOrderBomApi.PageParams) {
  return requestClient.get<PageResult<MesProWorkOrderBomApi.WorkOrderBom>>(
    '/mes/pro/work-order-bom/page',
    { params },
  );
}

/** 查询工单 BOM 详情 */
export function getWorkOrderBom(id: number) {
  return requestClient.get<MesProWorkOrderBomApi.WorkOrderBom>(
    `/mes/pro/work-order-bom/get?id=${id}`,
  );
}

/** 新增工单 BOM */
export function createWorkOrderBom(data: MesProWorkOrderBomApi.WorkOrderBom) {
  return requestClient.post('/mes/pro/work-order-bom/create', data);
}

/** 修改工单 BOM */
export function updateWorkOrderBom(data: MesProWorkOrderBomApi.WorkOrderBom) {
  return requestClient.put('/mes/pro/work-order-bom/update', data);
}

/** 删除工单 BOM */
export function deleteWorkOrderBom(id: number) {
  return requestClient.delete(`/mes/pro/work-order-bom/delete?id=${id}`);
}

/** 查询工单物料需求列表 */
export function getWorkOrderBomItemListByWorkOrderId(workOrderId: number) {
  return requestClient.get<MesProWorkOrderBomApi.WorkOrderBom[]>(
    `/mes/pro/work-order-bom/item-list-by-work-order-id?workOrderId=${workOrderId}`,
  );
}
