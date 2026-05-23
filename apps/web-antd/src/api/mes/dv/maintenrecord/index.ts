import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesDvMaintenRecordApi {
  /** MES 设备保养记录 */
  export interface MaintenRecord {
    id?: number; // 记录编号
    planId?: number; // 计划编号
    planName?: string; // 计划名称
    machineryId?: number; // 设备编号
    machineryCode?: string; // 设备编码
    machineryName?: string; // 设备名称
    machineryBrand?: string; // 品牌
    machinerySpecification?: string; // 规格型号
    maintenTime?: Date | number; // 保养时间
    userId?: number; // 用户编号
    nickname?: string; // 保养人名称
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询设备保养记录分页 */
export function getMaintenRecordPage(params: PageParam) {
  return requestClient.get<PageResult<MesDvMaintenRecordApi.MaintenRecord>>(
    '/mes/dv/mainten-record/page',
    { params },
  );
}

/** 查询设备保养记录详情 */
export function getMaintenRecord(id: number) {
  return requestClient.get<MesDvMaintenRecordApi.MaintenRecord>(
    `/mes/dv/mainten-record/get?id=${id}`,
  );
}

/** 新增设备保养记录 */
export function createMaintenRecord(data: MesDvMaintenRecordApi.MaintenRecord) {
  return requestClient.post<number>('/mes/dv/mainten-record/create', data);
}

/** 修改设备保养记录 */
export function updateMaintenRecord(data: MesDvMaintenRecordApi.MaintenRecord) {
  return requestClient.put('/mes/dv/mainten-record/update', data);
}

/** 提交设备保养记录 */
export function submitMaintenRecord(id: number) {
  return requestClient.put(`/mes/dv/mainten-record/submit?id=${id}`);
}

/** 删除设备保养记录 */
export function deleteMaintenRecord(id: number) {
  return requestClient.delete(`/mes/dv/mainten-record/delete?id=${id}`);
}

/** 导出设备保养记录 */
export function exportMaintenRecord(params: any) {
  return requestClient.download('/mes/dv/mainten-record/export-excel', {
    params,
  });
}
