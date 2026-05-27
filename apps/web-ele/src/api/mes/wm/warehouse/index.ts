import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmWarehouseApi {
  /** MES 仓库 */
  export interface Warehouse {
    id?: number; // 仓库编号
    code?: string; // 仓库编码
    name?: string; // 仓库名称
    address?: string; // 地址
    area?: number; // 面积
    chargeUserId?: number; // 负责人
    frozen?: boolean; // 是否冻结
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询仓库分页 */
export function getWarehousePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmWarehouseApi.Warehouse>>(
    '/mes/wm/warehouse/page',
    { params },
  );
}

/** 查询仓库精简列表 */
export function getWarehouseSimpleList() {
  return requestClient.get<MesWmWarehouseApi.Warehouse[]>(
    '/mes/wm/warehouse/simple-list',
  );
}

/** 查询仓库详情 */
export function getWarehouse(id: number) {
  return requestClient.get<MesWmWarehouseApi.Warehouse>(
    `/mes/wm/warehouse/get?id=${id}`,
  );
}

/** 新增仓库 */
export function createWarehouse(data: MesWmWarehouseApi.Warehouse) {
  return requestClient.post('/mes/wm/warehouse/create', data);
}

/** 修改仓库 */
export function updateWarehouse(data: MesWmWarehouseApi.Warehouse) {
  return requestClient.put('/mes/wm/warehouse/update', data);
}

/** 删除仓库 */
export function deleteWarehouse(id: number) {
  return requestClient.delete(`/mes/wm/warehouse/delete?id=${id}`);
}
