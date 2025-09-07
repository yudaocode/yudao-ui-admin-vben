import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace VitalSignsApi {
  /** 生命体征信息 */
  export interface VitalSigns {
    id: number; // 编号
    temperature: number; // 体温
    pulse: number; // 心率
    respiration: number; // 呼吸
    systolicPressure: number; // 高压
    diastolicPressure: number; // 高压
    pulseOxygenSaturation: number; // 血氧
    userId?: number; // 用户编号
  }
}

/** 查询生命体征分页 */
export function getVitalSignsPage(params: PageParam) {
  return requestClient.get<PageResult<VitalSignsApi.VitalSigns>>(
    '/member/vital-signs/page',
    { params },
  );
}

/** 查询生命体征详情 */
export function getVitalSigns(id: number) {
  return requestClient.get<VitalSignsApi.VitalSigns>(
    `/member/vital-signs/get?id=${id}`,
  );
}

/** 新增生命体征 */
export function createVitalSigns(data: VitalSignsApi.VitalSigns) {
  return requestClient.post('/member/vital-signs/create', data);
}

/** 修改生命体征 */
export function updateVitalSigns(data: VitalSignsApi.VitalSigns) {
  return requestClient.put('/member/vital-signs/update', data);
}

/** 删除生命体征 */
export function deleteVitalSigns(id: number) {
  return requestClient.delete(`/member/vital-signs/delete?id=${id}`);
}

/** 批量删除生命体征 */
export function deleteVitalSignsList(ids: number[]) {
  return requestClient.delete(
    `/member/vital-signs/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出生命体征 */
export function exportVitalSigns(params: any) {
  return requestClient.download('/member/vital-signs/export-excel', params);
}
