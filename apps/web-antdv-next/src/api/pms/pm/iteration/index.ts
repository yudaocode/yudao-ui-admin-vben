import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PmsIterationApi {
  /** PMS 项目迭代 */
  export interface Iteration {
    id?: number; // 迭代编号
    projectId: number; // 项目编号
    name: string; // 迭代名称
    ownerUserId?: number; // 负责人用户编号
    ownerUserName?: string; // 负责人姓名
    status?: number; // 迭代状态
    startTime?: number | string; // 开始时间
    endTime?: number | string; // 结束时间
    finishTime?: number; // 完成时间
    target?: string; // 迭代目标
    description?: string; // 迭代描述
    sort?: number; // 显示顺序
    progress?: number; // 完成进度百分比
    createTime?: number; // 创建时间
  }

  /** PMS 项目迭代开始 */
  export interface IterationStartReq {
    id: number; // 迭代编号
    startTime: number; // 开始时间
    endTime: number; // 结束时间
  }

  /** PMS 迭代概览 */
  export interface IterationOverview {
    totalCount: number; // 工作项总数
    pendingCount: number; // 未开始工作项数量
    processingCount: number; // 进行中工作项数量
    completedCount: number; // 已完成工作项数量
    progress: number; // 完成进度百分比
    typeCountMap: Record<number, number>; // 工作项类型数量统计
    typeStatusCountMap: Record<number, Record<number, number>>; // 工作项类型和状态数量统计
    statusTrends: Array<{
      completedCount: number;
      date: string;
      pendingCount: number;
      processingCount: number;
    }>; // 状态趋势
    burnDowns: Array<{
      actualRemaining: number;
      date: string;
      idealRemaining: number;
    }>; // 燃尽图数据（单位：小时）
    /** 最近动态列表 */
    recentActivities: Array<{
      content: string; // 动态内容
      createTime: number; // 创建时间
      id: number; // 动态编号
      operatorUserId: number; // 操作人编号
      operatorUserName?: string; // 操作人昵称
      workItemId: number; // 工作项编号
      workItemName: string; // 工作项名称
      workItemSerialNumber: number; // 工作项序号
    }>;
  }
}

/** 查询迭代分页 */
export function getIterationPage(params: PageParam) {
  return requestClient.get<PageResult<PmsIterationApi.Iteration>>(
    '/pms/pm/iteration/page',
    { params },
  );
}

/** 查询迭代详情 */
export function getIteration(id: number) {
  return requestClient.get<PmsIterationApi.Iteration>('/pms/pm/iteration/get', {
    params: { id },
  });
}

/** 查询迭代概览 */
export function getIterationOverview(id: number) {
  return requestClient.get<PmsIterationApi.IterationOverview>(
    '/pms/pm/iteration/overview',
    { params: { id } },
  );
}

/** 新增迭代 */
export function createIteration(data: PmsIterationApi.Iteration) {
  return requestClient.post<number>('/pms/pm/iteration/create', data);
}

/** 修改迭代 */
export function updateIteration(data: PmsIterationApi.Iteration) {
  return requestClient.put<boolean>('/pms/pm/iteration/update', data);
}

/** 开始迭代 */
export function startIteration(data: PmsIterationApi.IterationStartReq) {
  return requestClient.put<boolean>('/pms/pm/iteration/start', data);
}

/** 完成迭代 */
export function completeIteration(id: number) {
  return requestClient.put<boolean>('/pms/pm/iteration/complete', null, {
    params: { id },
  });
}

/** 删除迭代 */
export function deleteIteration(id: number) {
  return requestClient.delete<boolean>('/pms/pm/iteration/delete', {
    params: { id },
  });
}
