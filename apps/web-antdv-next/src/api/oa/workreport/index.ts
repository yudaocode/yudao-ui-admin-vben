import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaWorkReportApi {
  /** 工作汇报工作项 */
  export interface WorkItem {
    content: string; // 工作内容
    progress: number; // 完成进度
  }

  /** 工作汇报计划项 */
  export interface PlanItem {
    content: string; // 计划内容
  }

  /** OA 工作汇报 */
  export interface WorkReport {
    id?: number; // 汇报编号
    no?: string; // 汇报单号
    type: number; // 汇报类型
    status?: number; // 汇报状态
    title?: string; // 汇报标题
    periodKey?: string; // 汇报周期标识
    startTime: number | string; // 周期开始时间
    endTime: number | string; // 周期结束时间
    summary?: string; // 工作总结
    plan?: string; // 工作计划补充说明
    problem?: string; // 问题与协调事项
    workItems: WorkItem[]; // 已完成工作项
    planItems: PlanItem[]; // 工作计划项
    fileUrls: string[]; // 附件地址列表
    remark?: string; // 备注
    userId?: number; // 汇报人用户编号
    userName?: string; // 汇报人昵称
    deptId?: number; // 汇报人部门编号
    deptName?: string; // 汇报人部门名称
    createTime?: string; // 创建时间
    updateTime?: string; // 更新时间
  }

  /** 工作汇报统计的汇报明细 */
  export interface StatisticsReport {
    id: number; // 汇报编号
    no: string; // 汇报单号
    title: string; // 汇报标题
    periodKey: string; // 汇报周期标识
    status: number; // 汇报状态
    startTime: number | string; // 开始日期
    createTime: number | string; // 创建时间
  }

  /** 工作汇报员工统计 */
  export interface UserStatistics {
    userId: number; // 员工用户编号
    userName: string; // 员工昵称
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    expectedCount: number; // 应填数量
    submittedCount: number; // 已填数量
    missingCount: number; // 未填数量
    submittedReports: StatisticsReport[]; // 已提交汇报
    missingPeriodKeys: string[]; // 未填周期
  }

  /** 工作汇报统计 */
  export interface Statistics {
    userCount: number; // 统计人数
    expectedCount: number; // 应填数量
    submittedCount: number; // 已填数量
    missingCount: number; // 未填数量
    users: UserStatistics[]; // 员工统计列表
  }

  /** 工作汇报统计请求 */
  export interface StatisticsReq {
    type: number; // 汇报类型
    startTime: string; // 统计开始时间
    endTime: string; // 统计结束时间
    queryStartTime: string; // 完整周期查询开始时间
    queryEndTime: string; // 完整周期查询结束时间
    deptId?: number; // 部门编号
  }
}

/** 查询我的工作汇报分页 */
export function getWorkReportPage(params: PageParam) {
  return requestClient.get<PageResult<OaWorkReportApi.WorkReport>>(
    '/oa/work-report/page',
    { params },
  );
}

/** 查询工作汇报详情 */
export function getWorkReport(id: number) {
  return requestClient.get<OaWorkReportApi.WorkReport>('/oa/work-report/get', {
    params: { id },
  });
}

/** 新增工作汇报草稿 */
export function createWorkReport(data: OaWorkReportApi.WorkReport) {
  return requestClient.post<number>('/oa/work-report/create', data);
}

/** 修改工作汇报草稿 */
export function updateWorkReport(data: OaWorkReportApi.WorkReport) {
  return requestClient.put<boolean>('/oa/work-report/update', data);
}

/** 删除工作汇报草稿 */
export function deleteWorkReport(id: number) {
  return requestClient.delete<boolean>('/oa/work-report/delete', {
    params: { id },
  });
}

/** 提交工作汇报 */
export function submitWorkReport(id: number) {
  return requestClient.put<boolean>('/oa/work-report/submit', null, {
    params: { id },
  });
}

/** 取消提交工作汇报 */
export function cancelWorkReport(id: number) {
  return requestClient.put<boolean>('/oa/work-report/cancel', null, {
    params: { id },
  });
}

/** 查询工作汇报统计 */
export function getWorkReportStatistics(
  params: OaWorkReportApi.StatisticsReq,
) {
  return requestClient.get<OaWorkReportApi.Statistics>(
    '/oa/work-report/statistics',
    { params },
  );
}
