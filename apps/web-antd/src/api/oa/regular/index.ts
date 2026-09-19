import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaRegularApplyApi {
  /** OA 转正申请 */
  export interface RegularApply {
    id?: number; // 编号
    title?: string; // 标题
    urgency?: number; // 紧急程度
    startTime?: string; // 开始时间
    endTime?: string; // 结束时间
    days?: number; // 天数
    experience?: string; // 试用期心得
    understanding?: string; // 岗位职责理解
    growth?: string; // 试用期成长
    deficiency?: string; // 目前不足
    improvement?: string; // 工作改进
    suggestion?: string; // 产品意见建议
    status?: number; // 审批状态
    processInstanceId?: string; // 流程实例编号
    creator?: string; // 申请人编号
    creatorName?: string; // 申请人昵称
    createTime?: string; // 申请时间
    startUserSelectAssignees?: Record<string, number[]>; // 发起人自选审批人
  }
}

/** 查询本人转正申请分页 */
export function getRegularApplyPage(params: PageParam) {
  return requestClient.get<PageResult<OaRegularApplyApi.RegularApply>>(
    '/oa/regular-apply/page',
    { params },
  );
}

/** 查询转正申请详情 */
export function getRegularApply(id: number) {
  return requestClient.get<OaRegularApplyApi.RegularApply>(
    '/oa/regular-apply/get',
    { params: { id } },
  );
}

/** 创建转正申请草稿 */
export function createRegularApply(
  data: Partial<OaRegularApplyApi.RegularApply>,
) {
  return requestClient.post<number>('/oa/regular-apply/create', data);
}

/** 修改转正申请草稿 */
export function updateRegularApply(
  data: Partial<OaRegularApplyApi.RegularApply>,
) {
  return requestClient.put<boolean>('/oa/regular-apply/update', data);
}

/** 提交转正申请 */
export function submitRegularApply(
  id: number,
  startUserSelectAssignees: Record<string, number[]>,
) {
  return requestClient.post<boolean>('/oa/regular-apply/submit', {
    id,
    startUserSelectAssignees,
  });
}
