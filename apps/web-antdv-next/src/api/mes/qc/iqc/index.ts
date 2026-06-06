import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesQcIqcApi {
  /** MES 来料检验单 */
  export interface Iqc {
    id?: number; // 编号
    code?: string; // 检验单编号
    name?: string; // 检验单名称
    templateId?: number; // 检验模板 ID
    sourceDocType?: number; // 来源单据类型
    sourceDocId?: number; // 来源单据 ID
    sourceLineId?: number; // 来源单据行 ID
    sourceDocCode?: string; // 来源单据编号（关联查询）
    vendorId?: number; // 供应商 ID
    vendorNickname?: string; // 供应商简称（关联查询）
    vendorBatch?: string; // 供应商批次号
    itemId?: number; // 产品物料 ID
    itemCode?: string; // 产品物料编码（关联查询）
    itemName?: string; // 产品物料名称（关联查询）
    itemSpecification?: string; // 规格型号（关联查询）
    unitName?: string; // 单位名称（关联查询）
    receivedQuantity?: number; // 本次接收数量
    checkQuantity?: number; // 本次检测数量
    qualifiedQuantity?: number; // 合格品数量
    unqualifiedQuantity?: number; // 不合格品数量
    criticalRate?: number; // 致命缺陷率（%）
    majorRate?: number; // 严重缺陷率（%）
    minorRate?: number; // 轻微缺陷率（%）
    criticalQuantity?: number; // 致命缺陷数量
    majorQuantity?: number; // 严重缺陷数量
    minorQuantity?: number; // 轻微缺陷数量
    checkResult?: number; // 检测结果
    receiveDate?: number; // 来料日期
    inspectDate?: number; // 检测日期
    inspector?: string; // 检测人员（昵称）
    inspectorUserId?: number; // 检测人员 ID
    inspectorNickname?: string; // 检测人员昵称（关联查询）
    status?: number; // 状态
    remark?: string; // 备注
  }
}

/** 查询来料检验单分页 */
export function getIqcPage(params: PageParam) {
  return requestClient.get<PageResult<MesQcIqcApi.Iqc>>('/mes/qc/iqc/page', {
    params,
  });
}

/** 查询来料检验单详情 */
export function getIqc(id: number) {
  return requestClient.get<MesQcIqcApi.Iqc>(`/mes/qc/iqc/get?id=${id}`);
}

/** 新增来料检验单 */
export function createIqc(data: MesQcIqcApi.Iqc) {
  return requestClient.post('/mes/qc/iqc/create', data);
}

/** 修改来料检验单 */
export function updateIqc(data: MesQcIqcApi.Iqc) {
  return requestClient.put('/mes/qc/iqc/update', data);
}

/** 完成来料检验单 */
export function finishIqc(id: number) {
  return requestClient.put(`/mes/qc/iqc/finish?id=${id}`);
}

/** 删除来料检验单 */
export function deleteIqc(id: number) {
  return requestClient.delete(`/mes/qc/iqc/delete?id=${id}`);
}

/** 导出来料检验单 */
export function exportIqc(params: any) {
  return requestClient.download('/mes/qc/iqc/export-excel', { params });
}
