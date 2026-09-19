import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaVehicleReturnApi {
  /** OA 还车申请 */
  export interface VehicleReturn {
    id?: number; // 编号
    no?: string; // 还车申请单号（后端生成）
    applyId?: number; // 用车申请编号
    vehicleId?: number; // 车辆编号
    userId?: number; // 申请人编号
    deptId?: number; // 申请部门编号
    actualStartTime?: string; // 实际出车时间
    startLocation?: string; // 实际出车地点
    reason?: string; // 用车事由
    passenger?: string; // 随行人
    actualReturnTime?: string; // 实际回车时间
    returnLocation?: string; // 实际回车地点
    status?: number; // 审批状态
    processInstanceId?: string; // 流程实例编号
    remark?: string; // 还车说明
    fileUrls?: string[]; // 附件地址列表
    userName?: string; // 申请人姓名
    deptName?: string; // 申请部门
    applyNo?: string; // 用车申请单号
    vehicleNo?: string; // 车牌号
    createTime?: string; // 创建时间
  }
}

/** 查询本人还车申请分页 */
export function getVehicleReturnPage(params: PageParam) {
  return requestClient.get<PageResult<OaVehicleReturnApi.VehicleReturn>>(
    '/oa/vehicle-return/page',
    { params },
  );
}

/** 查询还车申请详情 */
export function getVehicleReturn(id: number) {
  return requestClient.get<OaVehicleReturnApi.VehicleReturn>(
    '/oa/vehicle-return/get',
    { params: { id } },
  );
}

/** 新增还车申请草稿 */
export function createVehicleReturn(
  data: Partial<OaVehicleReturnApi.VehicleReturn>,
) {
  return requestClient.post<number>('/oa/vehicle-return/create', data);
}

/** 修改还车申请草稿 */
export function updateVehicleReturn(
  data: Partial<OaVehicleReturnApi.VehicleReturn>,
) {
  return requestClient.put<boolean>('/oa/vehicle-return/update', data);
}

/** 删除还车申请草稿 */
export function deleteVehicleReturn(id: number) {
  return requestClient.delete<boolean>('/oa/vehicle-return/delete', {
    params: { id },
  });
}

/** 提交还车申请 */
export function submitVehicleReturn(id: number) {
  return requestClient.put<boolean>('/oa/vehicle-return/submit', null, {
    params: { id },
  });
}

/** 取消还车申请 */
export function cancelVehicleReturn(id: number) {
  return requestClient.put<boolean>('/oa/vehicle-return/cancel', null, {
    params: { id },
  });
}
