import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesQcIndicatorResultApi {
  /** MES 检验结果明细 */
  export interface IndicatorResultDetail {
    id?: number; // 编号
    resultId?: number; // 关联检验结果 ID
    indicatorId?: number; // 检测指标 ID
    value?: string; // 检测值（统一存为字符串）
    valueNumber?: number; // UI 数值绑定（提交前转字符串）
    remark?: string; // 备注
    // 关联查询字段（来自 indicator）
    indicatorName?: string; // 检测指标名称
    valueType?: number; // 质检值类型
    valueSpecification?: string; // 值属性
  }

  /** MES 检验结果 */
  export interface IndicatorResult {
    id?: number; // 编号
    code?: string; // 样品编号
    qcId?: number; // 关联质检单 ID
    qcType?: number; // 质检类型
    itemId?: number; // 产品物料 ID
    sn?: string; // 物资 SN
    remark?: string; // 备注
    createTime?: Date; // 创建时间
    items?: IndicatorResultDetail[]; // 检验结果明细列表
  }
}

/** 查询检验结果分页 */
export function getIndicatorResultPage(
  params: PageParam & { qcId?: number; qcType?: number },
) {
  return requestClient.get<PageResult<MesQcIndicatorResultApi.IndicatorResult>>(
    '/mes/qc/indicator-result/page',
    { params },
  );
}

/** 查询检验结果明细（含检测项模板）：编辑传 id，新增不传 */
export function getIndicatorResultDetail(
  qcId: number,
  qcType: number,
  id?: number,
) {
  return requestClient.get<MesQcIndicatorResultApi.IndicatorResult>(
    '/mes/qc/indicator-result/get-detail',
    { params: { id, qcId, qcType } },
  );
}

/** 新增检验结果 */
export function createIndicatorResult(
  data: MesQcIndicatorResultApi.IndicatorResult,
) {
  return requestClient.post('/mes/qc/indicator-result/create', data);
}

/** 修改检验结果 */
export function updateIndicatorResult(
  data: MesQcIndicatorResultApi.IndicatorResult,
) {
  return requestClient.put('/mes/qc/indicator-result/update', data);
}

/** 删除检验结果 */
export function deleteIndicatorResult(id: number) {
  return requestClient.delete(`/mes/qc/indicator-result/delete?id=${id}`);
}
