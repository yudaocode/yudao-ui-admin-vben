import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesDvCheckPlanApi {
  /** MES 点检保养方案 */
  export interface CheckPlan {
    id?: number; // 方案编号
    code?: string; // 方案编码
    name?: string; // 方案名称
    type?: number; // 方案类型
    startDate?: Date | number; // 开始日期
    endDate?: Date | number; // 结束日期
    cycleType?: number; // 周期类型
    cycleCount?: number; // 周期数量
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询点检保养方案分页 */
export function getCheckPlanPage(params: PageParam) {
  return requestClient.get<PageResult<MesDvCheckPlanApi.CheckPlan>>(
    '/mes/dv/check-plan/page',
    { params },
  );
}

/** 查询点检保养方案详情 */
export function getCheckPlan(id: number) {
  return requestClient.get<MesDvCheckPlanApi.CheckPlan>(
    `/mes/dv/check-plan/get?id=${id}`,
  );
}

/** 新增点检保养方案 */
export function createCheckPlan(data: MesDvCheckPlanApi.CheckPlan) {
  return requestClient.post<number>('/mes/dv/check-plan/create', data);
}

/** 修改点检保养方案 */
export function updateCheckPlan(data: MesDvCheckPlanApi.CheckPlan) {
  return requestClient.put('/mes/dv/check-plan/update', data);
}

/** 启用点检保养方案 */
export function enableCheckPlan(id: number) {
  return requestClient.put(`/mes/dv/check-plan/enable?id=${id}`);
}

/** 停用点检保养方案 */
export function disableCheckPlan(id: number) {
  return requestClient.put(`/mes/dv/check-plan/disable?id=${id}`);
}

/** 删除点检保养方案 */
export function deleteCheckPlan(id: number) {
  return requestClient.delete(`/mes/dv/check-plan/delete?id=${id}`);
}

/** 导出点检保养方案 */
export function exportCheckPlan(params: any) {
  return requestClient.download('/mes/dv/check-plan/export-excel', { params });
}
