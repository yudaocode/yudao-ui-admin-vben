import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesQcOqcApi {
  /** MES 出货检验单 */
  export interface Oqc {
    id?: number; // 编号
    code?: string; // 检验单编号
    name?: string; // 检验单名称
    templateId?: number; // 检验模板 ID
    sourceDocType?: number; // 来源单据类型
    sourceDocId?: number; // 来源单据 ID
    sourceLineId?: number; // 来源单据行 ID
    sourceDocCode?: string; // 来源单据编号（关联查询）
    clientId?: number; // 客户 ID
    clientNickname?: string; // 客户简称（关联查询）
    batchCode?: string; // 批次号
    itemId?: number; // 产品物料 ID
    itemCode?: string; // 产品物料编码（关联查询）
    itemName?: string; // 产品物料名称（关联查询）
    itemSpecification?: string; // 规格型号（关联查询）
    unitName?: string; // 单位名称（关联查询）
    minCheckQuantity?: number; // 最低检测数
    maxUnqualifiedQuantity?: number; // 最大不合格数
    outQuantity?: number; // 本次出货数量
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
    outDate?: number; // 出货日期
    inspectDate?: number; // 检测日期
    inspectorUserId?: number; // 检测人员用户 ID
    inspectorNickname?: string; // 检测人员昵称（关联查询）
    status?: number; // 状态
    remark?: string; // 备注
  }
}

/** 查询出货检验单分页 */
export function getOqcPage(params: PageParam) {
  return requestClient.get<PageResult<MesQcOqcApi.Oqc>>('/mes/qc/oqc/page', {
    params,
  });
}

/** 查询出货检验单详情 */
export function getOqc(id: number) {
  return requestClient.get<MesQcOqcApi.Oqc>(`/mes/qc/oqc/get?id=${id}`);
}

/** 新增出货检验单 */
export function createOqc(data: MesQcOqcApi.Oqc) {
  return requestClient.post('/mes/qc/oqc/create', data);
}

/** 修改出货检验单 */
export function updateOqc(data: MesQcOqcApi.Oqc) {
  return requestClient.put('/mes/qc/oqc/update', data);
}

/** 完成出货检验单 */
export function finishOqc(id: number) {
  return requestClient.put(`/mes/qc/oqc/finish?id=${id}`);
}

/** 删除出货检验单 */
export function deleteOqc(id: number) {
  return requestClient.delete(`/mes/qc/oqc/delete?id=${id}`);
}

/** 导出出货检验单 */
export function exportOqc(params: any) {
  return requestClient.download('/mes/qc/oqc/export-excel', { params });
}
