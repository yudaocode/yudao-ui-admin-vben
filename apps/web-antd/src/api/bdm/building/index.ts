import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace BuildingApi {
  /** 楼栋信息 */
  export interface Building {
    id: number; // 楼栋编号
    name?: string; // 楼栋名称
    zoneId?: number; // 区域编号
    sort?: number; // 显示顺序
  }
}

/** 查询楼栋分页 */
export function getBuildingPage(params: PageParam) {
  return requestClient.get<PageResult<BuildingApi.Building>>(
    '/bdm/building/page',
    { params },
  );
}

/** 查询楼栋列表 */
export function getBuildingListByZoneId(zoneId: number) {
  return requestClient.get<BuildingApi.Building[]>(
    `/bdm/building/list-by-zone-id?zoneId=${zoneId}`,
  );
}

/** 查询楼栋详情 */
export function getBuilding(id: number) {
  return requestClient.get<BuildingApi.Building>(`/bdm/building/get?id=${id}`);
}

/** 新增楼栋 */
export function createBuilding(data: BuildingApi.Building) {
  return requestClient.post('/bdm/building/create', data);
}

/** 修改楼栋 */
export function updateBuilding(data: BuildingApi.Building) {
  return requestClient.put('/bdm/building/update', data);
}

/** 删除楼栋 */
export function deleteBuilding(id: number) {
  return requestClient.delete(`/bdm/building/delete?id=${id}`);
}

/** 批量删除楼栋 */
export function deleteBuildingList(ids: number[]) {
  return requestClient.delete(`/bdm/building/delete-list?ids=${ids.join(',')}`);
}

/** 导出楼栋 */
export function exportBuilding(params: any) {
  return requestClient.download('/bdm/building/export-excel', params);
}
