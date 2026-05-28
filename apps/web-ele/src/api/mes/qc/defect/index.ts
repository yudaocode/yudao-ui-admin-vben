import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesQcDefectApi {
  /** MES 缺陷类型 */
  export interface Defect {
    id?: number; // 编号
    code?: string; // 缺陷编码
    name?: string; // 缺陷描述
    type?: number; // 检测项类型
    level?: number; // 缺陷等级
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询缺陷类型分页 */
export function getDefectPage(params: PageParam) {
  return requestClient.get<PageResult<MesQcDefectApi.Defect>>(
    '/mes/qc/defect/page',
    { params },
  );
}

/** 查询缺陷类型精简列表 */
export function getDefectSimpleList() {
  return requestClient.get<MesQcDefectApi.Defect[]>('/mes/qc/defect/simple-list');
}

/** 查询缺陷类型详情 */
export function getDefect(id: number) {
  return requestClient.get<MesQcDefectApi.Defect>(`/mes/qc/defect/get?id=${id}`);
}

/** 新增缺陷类型 */
export function createDefect(data: MesQcDefectApi.Defect) {
  return requestClient.post('/mes/qc/defect/create', data);
}

/** 修改缺陷类型 */
export function updateDefect(data: MesQcDefectApi.Defect) {
  return requestClient.put('/mes/qc/defect/update', data);
}

/** 删除缺陷类型 */
export function deleteDefect(id: number) {
  return requestClient.delete(`/mes/qc/defect/delete?id=${id}`);
}

/** 导出缺陷类型 */
export function exportDefect(params: any) {
  return requestClient.download('/mes/qc/defect/export-excel', { params });
}
