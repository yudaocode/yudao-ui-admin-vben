import type { PageParam, PageResult } from '@vben/request';

import type { OaVehicleApi } from '#/api/oa/vehicle';

import { requestClient } from '#/api/request';

export namespace OaVehicleApplyApi {
  /** OA 用车申请 */
  export interface VehicleApply {
    id?: number; // 编号
    no?: string; // 申请单号
    vehicleId?: number; // 车辆编号
    vehicleNo?: string; // 车牌号
    userId?: number; // 申请人编号
    deptId?: number; // 申请部门编号
    startTime?: string; // 预计出车时间
    endTime?: string; // 预计回车时间
    startLocation?: string; // 出车地点
    endLocation?: string; // 预计回车地点
    reason?: string; // 用车事由
    passenger?: string; // 随行人
    status?: number; // 审批状态
    returnStatus?: number; // 还车状态
    processInstanceId?: string; // 流程实例编号
    remark?: string; // 备注
    fileUrls?: string[]; // 附件地址列表
    userName?: string; // 申请人姓名
    deptName?: string; // 申请部门
    createTime?: string; // 创建时间
  }
}

/** 查询本人用车申请分页 */
export function getVehicleApplyPage(params: PageParam) {
  return requestClient.get<PageResult<OaVehicleApplyApi.VehicleApply>>(
    '/oa/vehicle-apply/page',
    { params },
  );
}

/** 查询本人用车申请详情 */
export function getVehicleApply(id: number) {
  return requestClient.get<OaVehicleApplyApi.VehicleApply>(
    '/oa/vehicle-apply/get',
    { params: { id } },
  );
}

/** 查询可申请的车辆分页 */
export function getAvailableVehiclePage(params: PageParam) {
  return requestClient.get<PageResult<OaVehicleApi.Vehicle>>(
    '/oa/vehicle-apply/vehicle-page',
    { params },
  );
}

/** 新增用车申请草稿 */
export function createVehicleApply(
  data: Partial<OaVehicleApplyApi.VehicleApply>,
) {
  return requestClient.post<number>('/oa/vehicle-apply/create', data);
}

/** 修改用车申请草稿 */
export function updateVehicleApply(
  data: Partial<OaVehicleApplyApi.VehicleApply>,
) {
  return requestClient.put<boolean>('/oa/vehicle-apply/update', data);
}

/** 删除用车申请草稿 */
export function deleteVehicleApply(id: number) {
  return requestClient.delete<boolean>('/oa/vehicle-apply/delete', {
    params: { id },
  });
}

/** 提交用车申请 */
export function submitVehicleApply(id: number) {
  return requestClient.put<boolean>('/oa/vehicle-apply/submit', null, {
    params: { id },
  });
}

/** 取消用车申请 */
export function cancelVehicleApply(id: number) {
  return requestClient.put<boolean>('/oa/vehicle-apply/cancel', null, {
    params: { id },
  });
}
