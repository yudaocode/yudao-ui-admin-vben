import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaTravelApplyApi {
  /** OA 出差申请 */
  export interface TravelApply {
    id?: number; // 编号
    no?: string; // 单据编号
    reason?: string; // 出差事由
    startTime?: number | string; // 开始日期
    endTime?: number | string; // 结束日期
    days?: number; // 出差天数
    companion?: string; // 同行人
    estimatedPrice?: number; // 预计费用
    reimburseStatus?: boolean; // 报销状态
    status?: number; // 审批状态
    processInstanceId?: string; // 流程实例编号
    creator?: string; // 申请人编号
    creatorName?: string; // 申请人姓名
    deptId?: number; // 申请部门编号
    deptName?: string; // 申请部门名称
    createTime?: number | string; // 创建时间
    remark?: string; // 备注
    items: TravelApplyItem[]; // 明细
    fileUrls: string[]; // 附件地址列表
  }

  /** OA 出差申请行程明细 */
  export interface TravelApplyItem {
    departureAreaId?: number; // 出发地区编号
    arrivalAreaId?: number; // 到达地区编号
    startTime?: number | string; // 开始日期
    endTime?: number | string; // 结束日期
    transportType?: number; // 交通方式
    remark?: string; // 备注
  }
}

/** 获得本人出差申请分页 */
export function getTravelApplyPage(params: PageParam) {
  return requestClient.get<PageResult<OaTravelApplyApi.TravelApply>>(
    '/oa/travel-apply/page',
    { params },
  );
}

/** 获得本人已通过的出差申请 */
export function getApprovedTravelApplyList() {
  return requestClient.get<OaTravelApplyApi.TravelApply[]>(
    '/oa/travel-apply/approved-list',
  );
}

/** 获得出差申请详情 */
export function getTravelApply(id: number) {
  return requestClient.get<OaTravelApplyApi.TravelApply>(
    '/oa/travel-apply/get',
    { params: { id } },
  );
}

/** 创建出差申请草稿 */
export function createTravelApply(data: OaTravelApplyApi.TravelApply) {
  return requestClient.post<number>('/oa/travel-apply/create', data);
}

/** 修改出差申请草稿 */
export function updateTravelApply(data: OaTravelApplyApi.TravelApply) {
  return requestClient.put<boolean>('/oa/travel-apply/update', data);
}

/** 提交出差申请 */
export function submitTravelApply(id: number) {
  return requestClient.post<boolean>('/oa/travel-apply/submit', { id });
}

/** 撤回出差申请 */
export function cancelTravelApply(id: number) {
  return requestClient.put<boolean>('/oa/travel-apply/cancel', null, {
    params: { id },
  });
}

/** 删除出差申请 */
export function deleteTravelApply(id: number) {
  return requestClient.delete<boolean>('/oa/travel-apply/delete', {
    params: { id },
  });
}
