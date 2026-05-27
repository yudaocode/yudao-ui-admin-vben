import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmWarehouseAreaApi {
  /** MES 库位 */
  export interface WarehouseArea {
    id?: number; // 库位编号
    code?: string; // 库位编码
    name?: string; // 库位名称
    warehouseId?: number; // 仓库编号
    warehouseName?: string; // 仓库名称
    locationId?: number; // 库区编号
    locationName?: string; // 库区名称
    area?: number; // 面积
    maxLoad?: number; // 最大载荷
    positionX?: number; // X 坐标
    positionY?: number; // Y 坐标
    positionZ?: number; // Z 坐标
    status?: number; // 状态
    frozen?: boolean; // 是否冻结
    allowItemMixing?: boolean; // 是否允许物料混放
    allowBatchMixing?: boolean; // 是否允许批次混放
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询库位分页 */
export function getWarehouseAreaPage(params: PageParam) {
  return requestClient.get<PageResult<MesWmWarehouseAreaApi.WarehouseArea>>(
    '/mes/wm/warehouse-area/page',
    { params },
  );
}

/** 查询库位精简列表 */
export function getWarehouseAreaSimpleList(locationId?: number) {
  return requestClient.get<MesWmWarehouseAreaApi.WarehouseArea[]>(
    '/mes/wm/warehouse-area/simple-list',
    { params: { locationId } },
  );
}

/** 查询库位详情 */
export function getWarehouseArea(id: number) {
  return requestClient.get<MesWmWarehouseAreaApi.WarehouseArea>(
    `/mes/wm/warehouse-area/get?id=${id}`,
  );
}

/** 新增库位 */
export function createWarehouseArea(data: MesWmWarehouseAreaApi.WarehouseArea) {
  return requestClient.post('/mes/wm/warehouse-area/create', data);
}

/** 修改库位 */
export function updateWarehouseArea(data: MesWmWarehouseAreaApi.WarehouseArea) {
  return requestClient.put('/mes/wm/warehouse-area/update', data);
}

/** 删除库位 */
export function deleteWarehouseArea(id: number) {
  return requestClient.delete(`/mes/wm/warehouse-area/delete?id=${id}`);
}
