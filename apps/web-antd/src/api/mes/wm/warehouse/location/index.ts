import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmWarehouseLocationApi {
  /** MES 库区 */
  export interface WarehouseLocation {
    id?: number; // 库区编号
    code?: string; // 库区编码
    name?: string; // 库区名称
    warehouseId?: number; // 仓库编号
    warehouseName?: string; // 仓库名称
    area?: number; // 面积
    frozen?: boolean; // 是否冻结
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询库区分页 */
export function getWarehouseLocationPage(params: PageParam) {
  return requestClient.get<
    PageResult<MesWmWarehouseLocationApi.WarehouseLocation>
  >('/mes/wm/warehouse-location/page', { params });
}

/** 查询库区精简列表 */
export function getWarehouseLocationSimpleList(warehouseId?: number) {
  return requestClient.get<MesWmWarehouseLocationApi.WarehouseLocation[]>(
    '/mes/wm/warehouse-location/simple-list',
    { params: { warehouseId } },
  );
}

/** 查询库区详情 */
export function getWarehouseLocation(id: number) {
  return requestClient.get<MesWmWarehouseLocationApi.WarehouseLocation>(
    `/mes/wm/warehouse-location/get?id=${id}`,
  );
}

/** 新增库区 */
export function createWarehouseLocation(
  data: MesWmWarehouseLocationApi.WarehouseLocation,
) {
  return requestClient.post('/mes/wm/warehouse-location/create', data);
}

/** 修改库区 */
export function updateWarehouseLocation(
  data: MesWmWarehouseLocationApi.WarehouseLocation,
) {
  return requestClient.put('/mes/wm/warehouse-location/update', data);
}

/** 删除库区 */
export function deleteWarehouseLocation(id: number) {
  return requestClient.delete(`/mes/wm/warehouse-location/delete?id=${id}`);
}

/** 批量设置库区下所有库位的混放规则 */
export function updateAreaByLocationId(
  locationId: number,
  allowItemMixing?: boolean,
  allowBatchMixing?: boolean,
) {
  return requestClient.put(
    '/mes/wm/warehouse-location/update-by-location-id',
    null,
    { params: { allowBatchMixing, allowItemMixing, locationId } },
  );
}
