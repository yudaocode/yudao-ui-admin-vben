import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace WmsWarehouseApi {
  /** WMS 仓库 */
  export interface Warehouse {
    id?: number;
    code?: string;
    name?: string;
    remark?: string;
    sort?: number;
    createTime?: Date;
  }
}

/** 查询仓库分页 */
export function getWarehousePage(params: PageParam) {
  return requestClient.get<PageResult<WmsWarehouseApi.Warehouse>>(
    '/wms/warehouse/page',
    { params },
  );
}

/** 查询仓库精简列表 */
export function getWarehouseSimpleList() {
  return requestClient.get<WmsWarehouseApi.Warehouse[]>(
    '/wms/warehouse/simple-list',
  );
}

/** 查询仓库详情 */
export function getWarehouse(id: number) {
  return requestClient.get<WmsWarehouseApi.Warehouse>(
    `/wms/warehouse/get?id=${id}`,
  );
}

/** 新增仓库 */
export function createWarehouse(data: WmsWarehouseApi.Warehouse) {
  return requestClient.post('/wms/warehouse/create', data);
}

/** 修改仓库 */
export function updateWarehouse(data: WmsWarehouseApi.Warehouse) {
  return requestClient.put('/wms/warehouse/update', data);
}

/** 删除仓库 */
export function deleteWarehouse(id: number) {
  return requestClient.delete(`/wms/warehouse/delete?id=${id}`);
}

/** 导出仓库 */
export function exportWarehouse(params: any) {
  return requestClient.download('/wms/warehouse/export-excel', { params });
}
