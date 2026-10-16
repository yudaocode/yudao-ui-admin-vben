import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaOvertimeApi {
  /** OA 加班申请 */
  export interface OvertimeApply {
    id?: number; // 编号
    title?: string; // 标题
    urgency?: number; // 紧急程度
    type?: number; // 加班类型
    startTime?: string; // 开始时间
    endTime?: string; // 结束时间
    days?: number; // 天数
    reason?: string; // 申请原因
    status?: number; // 审批状态
    processInstanceId?: string; // 流程实例编号
    creator?: string; // 申请人编号
    creatorName?: string; // 申请人昵称
    createTime?: string; // 申请时间
    startUserSelectAssignees?: Record<string, number[]>; // 发起人自选审批人
  }
}

/** 查询本人加班申请分页 */
export function getOvertimeApplyPage(params: PageParam) {
  return requestClient.get<PageResult<OaOvertimeApi.OvertimeApply>>(
    '/oa/overtime-apply/page',
    { params },
  );
}

/** 查询加班申请详情 */
export function getOvertimeApply(id: number) {
  return requestClient.get<OaOvertimeApi.OvertimeApply>(
    '/oa/overtime-apply/get',
    { params: { id } },
  );
}

/** 创建加班申请草稿 */
export function createOvertimeApply(data: OaOvertimeApi.OvertimeApply) {
  return requestClient.post<number>('/oa/overtime-apply/create', data);
}

/** 修改加班申请草稿 */
export function updateOvertimeApply(data: OaOvertimeApi.OvertimeApply) {
  return requestClient.put<boolean>('/oa/overtime-apply/update', data);
}

/** 提交加班申请 */
export function submitOvertimeApply(
  id: number,
  startUserSelectAssignees: Record<string, number[]>,
) {
  return requestClient.post<boolean>('/oa/overtime-apply/submit', {
    id,
    startUserSelectAssignees,
  });
}
