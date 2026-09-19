import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaResignApplyApi {
  /** OA 离职申请 */
  export interface ResignApply {
    id?: number; // 编号
    title?: string; // 标题
    urgency?: number; // 紧急程度
    reason?: string; // 申请原因
    handoverUserId?: number; // 工作交接人
    unfinishedWork?: string; // 未完成事宜
    hasPendingReimbursement?: boolean; // 是否有费用报销未完成
    suggestion?: string; // 申请人意见建议
    status?: number; // 审批状态
    processInstanceId?: string; // 流程实例编号
    creator?: string; // 申请人编号
    creatorName?: string; // 申请人昵称
    createTime?: string; // 申请时间
    startUserSelectAssignees?: Record<string, number[]>; // 发起人自选审批人
  }
}

/** 查询本人离职申请分页 */
export function getResignApplyPage(params: PageParam) {
  return requestClient.get<PageResult<OaResignApplyApi.ResignApply>>(
    '/oa/resign-apply/page',
    { params },
  );
}

/** 查询离职申请详情 */
export function getResignApply(id: number) {
  return requestClient.get<OaResignApplyApi.ResignApply>(
    '/oa/resign-apply/get',
    { params: { id } },
  );
}

/** 创建离职申请草稿 */
export function createResignApply(
  data: Partial<OaResignApplyApi.ResignApply>,
) {
  return requestClient.post<number>('/oa/resign-apply/create', data);
}

/** 修改离职申请草稿 */
export function updateResignApply(
  data: Partial<OaResignApplyApi.ResignApply>,
) {
  return requestClient.put<boolean>('/oa/resign-apply/update', data);
}

/** 提交离职申请 */
export function submitResignApply(
  id: number,
  startUserSelectAssignees: Record<string, number[]>,
) {
  return requestClient.post<boolean>('/oa/resign-apply/submit', {
    id,
    startUserSelectAssignees,
  });
}
