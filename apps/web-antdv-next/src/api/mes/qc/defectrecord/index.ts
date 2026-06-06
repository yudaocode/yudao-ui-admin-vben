import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesQcDefectRecordApi {
  /** MES 质检缺陷记录 */
  export interface DefectRecord {
    id?: number; // 编号
    qcType?: number; // 检验类型
    qcId?: number; // 检验单 ID
    lineId?: number; // 检验行 ID
    name?: string; // 缺陷描述
    level?: number; // 缺陷等级
    quantity?: number; // 缺陷数量
    remark?: string; // 备注
  }
}

/** 查询质检缺陷记录 */
export function getDefectRecord(id: number) {
  return requestClient.get<MesQcDefectRecordApi.DefectRecord>(
    `/mes/qc/defect-record/get?id=${id}`,
  );
}

/** 查询质检缺陷记录分页 */
export function getDefectRecordPage(
  params: PageParam & { lineId?: number; qcId?: number; qcType?: number; },
) {
  return requestClient.get<PageResult<MesQcDefectRecordApi.DefectRecord>>(
    '/mes/qc/defect-record/page',
    { params },
  );
}

/** 新增质检缺陷记录 */
export function createDefectRecord(data: MesQcDefectRecordApi.DefectRecord) {
  return requestClient.post('/mes/qc/defect-record/create', data);
}

/** 修改质检缺陷记录 */
export function updateDefectRecord(data: MesQcDefectRecordApi.DefectRecord) {
  return requestClient.put('/mes/qc/defect-record/update', data);
}

/** 删除质检缺陷记录 */
export function deleteDefectRecord(id: number) {
  return requestClient.delete(`/mes/qc/defect-record/delete?id=${id}`);
}
