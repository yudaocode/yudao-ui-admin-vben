import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesCalPlanApi {
  /** MES 排班计划 */
  export interface Plan {
    id?: number; // 计划编号
    code?: string; // 计划编码
    name?: string; // 计划名称
    calendarType?: number; // 班组类型
    startDate?: number; // 开始日期
    endDate?: number; // 结束日期
    shiftType?: number; // 轮班方式
    shiftMethod?: number; // 倒班方式
    shiftCount?: number; // 倒班天数
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询排班计划分页 */
export function getPlanPage(params: PageParam) {
  return requestClient.get<PageResult<MesCalPlanApi.Plan>>(
    '/mes/cal/plan/page',
    { params },
  );
}

/** 查询排班计划详情 */
export function getPlan(id: number) {
  return requestClient.get<MesCalPlanApi.Plan>(`/mes/cal/plan/get?id=${id}`);
}

/** 新增排班计划 */
export function createPlan(data: MesCalPlanApi.Plan) {
  return requestClient.post<number>('/mes/cal/plan/create', data);
}

/** 修改排班计划 */
export function updatePlan(data: MesCalPlanApi.Plan) {
  return requestClient.put('/mes/cal/plan/update', data);
}

/** 确认排班计划 */
export function confirmPlan(id: number) {
  return requestClient.put(`/mes/cal/plan/confirm?id=${id}`);
}

/** 删除排班计划 */
export function deletePlan(id: number) {
  return requestClient.delete(`/mes/cal/plan/delete?id=${id}`);
}

/** 导出排班计划 */
export function exportPlan(params: any) {
  return requestClient.download('/mes/cal/plan/export-excel', { params });
}
