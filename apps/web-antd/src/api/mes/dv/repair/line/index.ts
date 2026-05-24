import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesDvRepairLineApi {
  /** MES 维修工单行 */
  export interface RepairLine {
    id?: number; // 明细编号
    repairId?: number; // 维修工单编号
    subjectId?: number; // 项目编号
    subjectName?: string; // 项目名称
    subjectContent?: string; // 项目内容
    subjectStandard?: string; // 项目标准
    malfunction?: string; // 故障描述
    malfunctionUrl?: string; // 故障图片 URL
    description?: string; // 维修描述
    remark?: string; // 备注
  }
}

/** 查询维修工单行分页 */
export function getRepairLinePage(params: PageParam) {
  return requestClient.get<PageResult<MesDvRepairLineApi.RepairLine>>(
    '/mes/dv/repair-line/page',
    { params },
  );
}

/** 查询维修工单行详情 */
export function getRepairLine(id: number) {
  return requestClient.get<MesDvRepairLineApi.RepairLine>(
    `/mes/dv/repair-line/get?id=${id}`,
  );
}

/** 新增维修工单行 */
export function createRepairLine(data: MesDvRepairLineApi.RepairLine) {
  return requestClient.post('/mes/dv/repair-line/create', data);
}

/** 修改维修工单行 */
export function updateRepairLine(data: MesDvRepairLineApi.RepairLine) {
  return requestClient.put('/mes/dv/repair-line/update', data);
}

/** 删除维修工单行 */
export function deleteRepairLine(id: number) {
  return requestClient.delete(`/mes/dv/repair-line/delete?id=${id}`);
}
