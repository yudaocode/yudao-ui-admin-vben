import { requestClient } from '#/api/request';

export namespace MesDvCheckPlanMachineryApi {
  /** MES 点检保养方案设备 */
  export interface CheckPlanMachinery {
    id?: number; // 关联编号
    planId?: number; // 方案编号
    machineryId?: number; // 设备编号
    machineryCode?: string; // 设备编码
    machineryName?: string; // 设备名称
    machineryBrand?: string; // 品牌
    machinerySpecification?: string; // 规格型号
    remark?: string; // 备注
  }
}

/** 查询指定方案的设备列表 */
export function getCheckPlanMachineryListByPlan(planId: number) {
  return requestClient.get<MesDvCheckPlanMachineryApi.CheckPlanMachinery[]>(
    `/mes/dv/check-plan-machinery/list-by-plan?planId=${planId}`,
  );
}

/** 新增方案设备关联 */
export function createCheckPlanMachinery(
  data: MesDvCheckPlanMachineryApi.CheckPlanMachinery,
) {
  return requestClient.post('/mes/dv/check-plan-machinery/create', data);
}

/** 删除方案设备关联 */
export function deleteCheckPlanMachinery(id: number) {
  return requestClient.delete(`/mes/dv/check-plan-machinery/delete?id=${id}`);
}
