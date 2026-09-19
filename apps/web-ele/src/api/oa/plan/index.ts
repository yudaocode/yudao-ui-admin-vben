import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaPlanApi {
  /** OA 工作计划 */
  export interface Plan {
    id?: number; // 计划编号
    userId?: number; // 用户编号
    userName?: string; // 用户昵称
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    type: number; // 计划类型
    status: number; // 计划状态
    title: string; // 标题
    label?: string; // 标签
    content: string; // 计划内容
    summary?: string; // 计划总结
    comment?: string; // 计划点评
    startTime: number | string; // 开始时间
    endTime: number | string; // 结束时间
    fileUrls: string[]; // 附件地址列表
    createTime?: string; // 创建时间
  }

  /** OA 工作计划报表 */
  export interface PlanReport {
    userId: number; // 用户编号
    userName: string; // 用户昵称
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    planId?: number; // 计划编号
    status?: number; // 计划状态
    title?: string; // 标题
    label?: string; // 标签
    content?: string; // 计划内容
    summary?: string; // 计划总结
    comment?: string; // 计划点评
    fileUrls?: string[]; // 附件地址列表
    createTime?: string; // 创建时间
  }
}

/** 查询工作计划分页 */
export function getPlanPage(params: PageParam) {
  return requestClient.get<PageResult<OaPlanApi.Plan>>('/oa/plan/page', {
    params,
  });
}

/** 查询工作计划报表分页 */
export function getPlanReportPage(params: PageParam) {
  return requestClient.get<PageResult<OaPlanApi.PlanReport>>(
    '/oa/plan/report-page',
    { params },
  );
}

/** 查询工作计划详情 */
export function getPlan(id: number) {
  return requestClient.get<OaPlanApi.Plan>('/oa/plan/get', { params: { id } });
}

/** 新增工作计划 */
export function createPlan(data: Partial<OaPlanApi.Plan>) {
  return requestClient.post<number>('/oa/plan/create', data);
}

/** 修改工作计划 */
export function updatePlan(data: Partial<OaPlanApi.Plan>) {
  return requestClient.put<boolean>('/oa/plan/update', data);
}

/** 删除工作计划 */
export function deletePlan(id: number) {
  return requestClient.delete<boolean>('/oa/plan/delete', { params: { id } });
}

/** 点评工作计划 */
export function addPlanComment(id: number, comment: string) {
  return requestClient.put<boolean>('/oa/plan/add-comment', { id, comment });
}
