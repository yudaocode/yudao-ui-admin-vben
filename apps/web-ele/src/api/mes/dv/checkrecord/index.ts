import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesDvCheckRecordApi {
  /** MES 设备点检记录 */
  export interface CheckRecord {
    id?: number; // 记录编号
    planId?: number; // 点检计划编号
    planName?: string; // 计划名称
    machineryId?: number; // 设备编号
    machineryCode?: string; // 设备编码
    machineryName?: string; // 设备名称
    machineryBrand?: string; // 品牌
    machinerySpecification?: string; // 规格型号
    checkTime?: Date | number; // 点检时间
    userId?: number; // 点检人编号
    nickname?: string; // 点检人名称
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询设备点检记录分页 */
export function getCheckRecordPage(params: PageParam) {
  return requestClient.get<PageResult<MesDvCheckRecordApi.CheckRecord>>(
    '/mes/dv/check-record/page',
    { params },
  );
}

/** 查询设备点检记录详情 */
export function getCheckRecord(id: number) {
  return requestClient.get<MesDvCheckRecordApi.CheckRecord>(
    `/mes/dv/check-record/get?id=${id}`,
  );
}

/** 新增设备点检记录 */
export function createCheckRecord(data: MesDvCheckRecordApi.CheckRecord) {
  return requestClient.post<number>('/mes/dv/check-record/create', data);
}

/** 修改设备点检记录 */
export function updateCheckRecord(data: MesDvCheckRecordApi.CheckRecord) {
  return requestClient.put('/mes/dv/check-record/update', data);
}

/** 提交设备点检记录 */
export function submitCheckRecord(id: number) {
  return requestClient.put(`/mes/dv/check-record/submit?id=${id}`);
}

/** 删除设备点检记录 */
export function deleteCheckRecord(id: number) {
  return requestClient.delete(`/mes/dv/check-record/delete?id=${id}`);
}

/** 导出设备点检记录 */
export function exportCheckRecord(params: any) {
  return requestClient.download('/mes/dv/check-record/export-excel', {
    params,
  });
}
