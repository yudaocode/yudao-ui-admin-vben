import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesDvRepairApi {
  /** MES 维修工单 */
  export interface Repair {
    id?: number; // 工单编号
    code?: string; // 维修工单编码
    name?: string; // 维修工单名称
    machineryId?: number; // 设备编号
    machineryCode?: string; // 设备编码
    machineryName?: string; // 设备名称
    machineryBrand?: string; // 品牌
    machinerySpecification?: string; // 规格型号
    requireDate?: Date | number; // 报修日期
    finishDate?: Date | number; // 维修完成日期
    confirmDate?: Date | number; // 验收日期
    result?: number; // 维修结果
    acceptedUserId?: number; // 维修人编号
    acceptedUserNickname?: string; // 维修人名称
    confirmUserId?: number; // 验收人编号
    confirmUserNickname?: string; // 验收人名称
    sourceDocType?: number; // 来源单据类型
    sourceDocId?: number; // 来源单据编号
    sourceDocCode?: string; // 来源单据编码
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询维修工单分页 */
export function getRepairPage(params: PageParam) {
  return requestClient.get<PageResult<MesDvRepairApi.Repair>>(
    '/mes/dv/repair/page',
    { params },
  );
}

/** 查询维修工单详情 */
export function getRepair(id: number) {
  return requestClient.get<MesDvRepairApi.Repair>(
    `/mes/dv/repair/get?id=${id}`,
  );
}

/** 新增维修工单 */
export function createRepair(data: MesDvRepairApi.Repair) {
  return requestClient.post<number>('/mes/dv/repair/create', data);
}

/** 修改维修工单 */
export function updateRepair(data: MesDvRepairApi.Repair) {
  return requestClient.put('/mes/dv/repair/update', data);
}

/** 删除维修工单 */
export function deleteRepair(id: number) {
  return requestClient.delete(`/mes/dv/repair/delete?id=${id}`);
}

/** 导出维修工单 */
export function exportRepair(params: any) {
  return requestClient.download('/mes/dv/repair/export-excel', { params });
}

/** 提交维修工单 */
export function submitRepair(id: number) {
  return requestClient.put(`/mes/dv/repair/submit?id=${id}`);
}

/** 确认维修完成 */
export function confirmRepair(data: MesDvRepairApi.Repair) {
  return requestClient.put('/mes/dv/repair/confirm', data);
}

/** 完成验收 */
export function finishRepair(id: number, result: number) {
  return requestClient.put(`/mes/dv/repair/finish?id=${id}&result=${result}`);
}
