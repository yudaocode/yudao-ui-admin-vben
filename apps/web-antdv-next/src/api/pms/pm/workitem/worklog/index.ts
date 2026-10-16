import { requestClient } from '#/api/request';

export namespace PmsWorkItemWorkLogApi {
  /** PMS 工作项工时记录 */
  export interface WorkItemWorkLog {
    id?: number; // 工时记录编号
    workItemId: number; // 工作项编号
    workItemName?: string; // 工作项标题
    actualHours: number; // 实际投入工时，单位：小时
    remainingHours: number; // 本次登记后的剩余工时，单位：小时
    description?: string; // 工时说明
    creatorUserId?: number; // 登记人用户编号
    creatorUserName?: string; // 登记人姓名
    createTime?: number; // 登记时间
    updateTime?: number; // 更新时间
  }

  /** PMS 工作项工时汇总 */
  export interface WorkItemWorkLogSummary {
    estimatedHours?: number; // 预估工时，单位：小时
    actualHours: number; // 已登记工时，单位：小时
    remainingHours?: number; // 剩余工时，单位：小时
    records: WorkItemWorkLog[]; // 工时记录列表
  }

  /** PMS 项目工时报表工作项 */
  export interface ProjectWorkLogReportItem {
    workItemId: number; // 工作项编号
    serialNumber: number; // 工作项序号
    name: string; // 工作项标题
    type: number; // 工作项类型
    totalHours: number; // 总工时
    dailyHours: Record<string, number>; // 每日工时，key 为日期
  }

  /** PMS 项目工时报表迭代分组 */
  export interface ProjectWorkLogReportGroup {
    iterationId?: number; // 迭代编号，未规划事项为空
    iterationName: string; // 迭代名称
    totalHours: number; // 分组总工时
    items: ProjectWorkLogReportItem[]; // 工作项列表
  }

  /** PMS 项目工时报表 */
  export interface ProjectWorkLogReport {
    dates: string[]; // 报表日期列表
    totalHours: number; // 总工时
    groups: ProjectWorkLogReportGroup[]; // 迭代分组
  }
}

/** 查询工作项工时记录详情 */
export function getWorkItemWorkLog(id: number) {
  return requestClient.get<PmsWorkItemWorkLogApi.WorkItemWorkLog>(
    '/pms/pm/work-item-work-log/get',
    { params: { id } },
  );
}

/** 查询工时汇总 */
export function getWorkItemWorkLogSummary(workItemId: number) {
  return requestClient.get<PmsWorkItemWorkLogApi.WorkItemWorkLogSummary>(
    '/pms/pm/work-item-work-log/summary',
    { params: { workItemId } },
  );
}

/** 新增工作项工时 */
export function createWorkItemWorkLog(
  data: PmsWorkItemWorkLogApi.WorkItemWorkLog,
) {
  return requestClient.post<number>('/pms/pm/work-item-work-log/create', data);
}

/** 修改工作项工时 */
export function updateWorkItemWorkLog(
  data: PmsWorkItemWorkLogApi.WorkItemWorkLog,
) {
  return requestClient.put<boolean>('/pms/pm/work-item-work-log/update', data);
}

/** 查询项目工时报表 */
export function getProjectWorkItemWorkLogReport(params: {
  createTime: [string, string];
  iterationName?: string;
  projectId: number;
}) {
  return requestClient.get<PmsWorkItemWorkLogApi.ProjectWorkLogReport>(
    '/pms/pm/work-item-work-log/project-report',
    { params },
  );
}
