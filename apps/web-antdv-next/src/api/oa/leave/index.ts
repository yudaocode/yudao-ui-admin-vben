import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaLeaveApi {
  /** OA 请假申请 */
  export interface LeaveApply {
    id?: number; // 编号
    title?: string; // 标题
    urgency?: number; // 紧急程度
    type?: number; // 请假类型
    startTime?: string; // 开始时间
    endTime?: string; // 结束时间
    days?: number; // 天数
    reason?: string; // 申请原因
    status?: number; // 审批状态
    processInstanceId?: string; // 流程实例编号
    fileUrls?: string[]; // 附件地址列表
    creator?: string; // 申请人编号
    creatorName?: string; // 申请人昵称
    createTime?: string; // 申请时间
    startUserSelectAssignees?: Record<string, number[]>; // 发起人自选审批人
  }
}

/** 查询本人请假申请分页 */
export function getLeaveApplyPage(params: PageParam) {
  return requestClient.get<PageResult<OaLeaveApi.LeaveApply>>(
    '/oa/leave-apply/page',
    { params },
  );
}

/** 查询请假申请详情 */
export function getLeaveApply(id: number) {
  return requestClient.get<OaLeaveApi.LeaveApply>('/oa/leave-apply/get', {
    params: { id },
  });
}

/** 创建请假申请草稿 */
export function createLeaveApply(data: Partial<OaLeaveApi.LeaveApply>) {
  return requestClient.post<number>('/oa/leave-apply/create', data);
}

/** 修改请假申请草稿 */
export function updateLeaveApply(data: Partial<OaLeaveApi.LeaveApply>) {
  return requestClient.put<boolean>('/oa/leave-apply/update', data);
}

/** 提交请假申请 */
export function submitLeaveApply(
  id: number,
  startUserSelectAssignees: Record<string, number[]>,
) {
  return requestClient.post<boolean>('/oa/leave-apply/submit', {
    id,
    startUserSelectAssignees,
  });
}
