import { requestClient } from '#/api/request';

export namespace MesCalPlanTeamApi {
  /** MES 计划班组关联 */
  export interface PlanTeam {
    id?: number; // 关联编号
    planId?: number; // 排班计划编号
    teamId?: number; // 班组编号
    teamCode?: string; // 班组编码
    teamName?: string; // 班组名称
    remark?: string; // 备注
  }
}

/** 查询指定排班计划的班组列表 */
export function getPlanTeamListByPlan(planId: number) {
  return requestClient.get<MesCalPlanTeamApi.PlanTeam[]>(
    `/mes/cal/plan-team/list-by-plan?planId=${planId}`,
  );
}

/** 新增计划班组关联 */
export function createPlanTeam(data: MesCalPlanTeamApi.PlanTeam) {
  return requestClient.post('/mes/cal/plan-team/create', data);
}

/** 删除计划班组关联 */
export function deletePlanTeam(id: number) {
  return requestClient.delete(`/mes/cal/plan-team/delete?id=${id}`);
}
