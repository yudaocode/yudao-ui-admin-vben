import { requestClient } from '#/api/request';

export namespace MesDvCheckPlanSubjectApi {
  /** MES 点检保养方案项目 */
  export interface CheckPlanSubject {
    id?: number; // 关联编号
    planId?: number; // 方案编号
    subjectId?: number; // 项目编号
    subjectCode?: string; // 项目编码
    subjectName?: string; // 项目名称
    subjectType?: number; // 项目类型
    subjectContent?: string; // 项目内容
    subjectStandard?: string; // 标准
    remark?: string; // 备注
  }
}

/** 查询指定方案的项目列表 */
export function getCheckPlanSubjectListByPlan(planId: number) {
  return requestClient.get<MesDvCheckPlanSubjectApi.CheckPlanSubject[]>(
    `/mes/dv/check-plan-subject/list-by-plan?planId=${planId}`,
  );
}

/** 新增方案项目关联 */
export function createCheckPlanSubject(
  data: MesDvCheckPlanSubjectApi.CheckPlanSubject,
) {
  return requestClient.post('/mes/dv/check-plan-subject/create', data);
}

/** 删除方案项目关联 */
export function deleteCheckPlanSubject(id: number) {
  return requestClient.delete(`/mes/dv/check-plan-subject/delete?id=${id}`);
}
