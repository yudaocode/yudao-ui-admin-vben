import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ApartmentApi {
  /** 房屋信息 */
  export interface Apartment {
    id: number; // 房屋编号
    name?: string; // 房屋名称
    floorId?: number; // 楼栋编号
    sort?: number; // 显示顺序
  }
}

/** 查询房屋分页 */
export function getApartmentPage(params: PageParam) {
  return requestClient.get<PageResult<ApartmentApi.Apartment>>(
    '/bdm/apartment/page',
    { params },
  );
}

/** 根据楼层编号查询房屋列表 */
export function getApartmentListByFloorId(floorId: number) {
  return requestClient.get<ApartmentApi.Apartment[]>(
    `/bdm/apartment/list-by-floor-id?floorId=${floorId}`,
  );
}

/** 查询房屋详情 */
export function getApartment(id: number) {
  return requestClient.get<ApartmentApi.Apartment>(
    `/bdm/apartment/get?id=${id}`,
  );
}

/** 新增房屋 */
export function createApartment(data: ApartmentApi.Apartment) {
  return requestClient.post('/bdm/apartment/create', data);
}

/** 修改房屋 */
export function updateApartment(data: ApartmentApi.Apartment) {
  return requestClient.put('/bdm/apartment/update', data);
}

/** 删除房屋 */
export function deleteApartment(id: number) {
  return requestClient.delete(`/bdm/apartment/delete?id=${id}`);
}

/** 批量删除房屋 */
export function deleteApartmentList(ids: number[]) {
  return requestClient.delete(
    `/bdm/apartment/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出房屋 */
export function exportApartment(params: any) {
  return requestClient.download('/bdm/apartment/export-excel', params);
}
