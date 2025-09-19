import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace BedApi {
  /** 床位信息 */
  export interface Bed {
    id: number; // 床位编号
    name?: string; // 床位名称
    areaId?: number; // 地区编号
    zoneId?: number; // 区域编号
    buildingId?: number; // 楼栋编号
    floorId?: number; // 楼层编号
    apartmentId?: number; // 房屋编号
    sort?: number; // 显示顺序
  }
}

/** 查询床位分页 */
export function getBedPage(params: PageParam) {
  return requestClient.get<PageResult<BedApi.Bed>>('/bdm/bed/page', { params });
}

/** 根据房屋编号查询床位列表 */
export function getBedListByApartmentId(apartmentId: number) {
  return requestClient.get<BedApi.Bed[]>(
    `/bdm/bed/list-by-apartment-id?apartmentId=${apartmentId}`,
  );
}

/** 查询床位详情 */
export function getBed(id: number) {
  return requestClient.get<BedApi.Bed>(`/bdm/bed/get?id=${id}`);
}

/** 新增床位 */
export function createBed(data: BedApi.Bed) {
  return requestClient.post('/bdm/bed/create', data);
}

/** 修改床位 */
export function updateBed(data: BedApi.Bed) {
  return requestClient.put('/bdm/bed/update', data);
}

/** 删除床位 */
export function deleteBed(id: number) {
  return requestClient.delete(`/bdm/bed/delete?id=${id}`);
}

/** 批量删除床位 */
export function deleteBedList(ids: number[]) {
  return requestClient.delete(`/bdm/bed/delete-list?ids=${ids.join(',')}`);
}

/** 导出床位 */
export function exportBed(params: any) {
  return requestClient.download('/bdm/bed/export-excel', params);
}
