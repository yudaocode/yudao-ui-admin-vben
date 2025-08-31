import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace FloorApi {
  /** 楼层信息 */
  export interface Floor {
    id: number; // 楼层编号
    name?: string; // 楼层名称
    buildingId?: number; // 楼栋编号
    sort?: number; // 显示顺序
  }
}

/** 查询楼层分页 */
export function getFloorPage(params: PageParam) {
  return requestClient.get<PageResult<FloorApi.Floor>>('/bdm/floor/page', {
    params,
  });
}

/** 根据楼栋编号查询楼层列表 */
export function getFloorListByBuildingId(buildingId: number) {
  return requestClient.get<FloorApi.Floor[]>(
    `/bdm/floor/list-by-building-id?buildingId=${buildingId}`,
  );
}

/** 查询楼层详情 */
export function getFloor(id: number) {
  return requestClient.get<FloorApi.Floor>(`/bdm/floor/get?id=${id}`);
}

/** 新增楼层 */
export function createFloor(data: FloorApi.Floor) {
  return requestClient.post('/bdm/floor/create', data);
}

/** 修改楼层 */
export function updateFloor(data: FloorApi.Floor) {
  return requestClient.put('/bdm/floor/update', data);
}

/** 删除楼层 */
export function deleteFloor(id: number) {
  return requestClient.delete(`/bdm/floor/delete?id=${id}`);
}

/** 批量删除楼层 */
export function deleteFloorList(ids: number[]) {
  return requestClient.delete(`/bdm/floor/delete-list?ids=${ids.join(',')}`);
}

/** 导出楼层 */
export function exportFloor(params: any) {
  return requestClient.download('/bdm/floor/export-excel', params);
}
