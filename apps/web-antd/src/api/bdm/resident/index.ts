import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ResidentApi {
  /** 住户信息 */
  export interface Resident {
    id: number; // 房屋编号
    userId?: number; // 用户编号
    apartmentId?: number; // 房屋编号
  }
}

/** 查询住户分页 */
export function getResidentPage(params: PageParam) {
  return requestClient.get<PageResult<ResidentApi.Resident>>(
    '/member/resident/page',
    { params },
  );
}

/** 查询住户详情 */
export function getResident(id: number) {
  return requestClient.get<ResidentApi.Resident>(
    `/member/resident/get?id=${id}`,
  );
}

/** 新增住户 */
export function createResident(data: ResidentApi.Resident) {
  return requestClient.post('/member/resident/create', data);
}

/** 修改住户 */
export function updateResident(data: ResidentApi.Resident) {
  return requestClient.put('/member/resident/update', data);
}

/** 删除住户 */
export function deleteResident(id: number) {
  return requestClient.delete(`/member/resident/delete?id=${id}`);
}

/** 批量删除住户 */
export function deleteResidentList(ids: number[]) {
  return requestClient.delete(
    `/member/resident/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出住户 */
export function exportResident(params: any) {
  return requestClient.download('/member/resident/export-excel', params);
}
