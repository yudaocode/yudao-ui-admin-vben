import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesQcTemplateIndicatorApi {
  /** MES 质检方案-检测指标项 */
  export interface TemplateIndicator {
    id?: number; // 编号
    templateId?: number; // 质检方案ID
    indicatorId?: number; // 质检指标ID
    checkMethod?: string; // 检测方法
    standardValue?: number; // 标准值
    unitMeasureId?: number; // 计量单位ID
    thresholdMax?: number; // 误差上限
    thresholdMin?: number; // 误差下限
    docUrl?: string; // 说明图URL
    remark?: string; // 备注
    indicatorCode?: string; // 检测项编码（JOIN）
    indicatorName?: string; // 检测项名称（JOIN）
    indicatorType?: number; // 检测项类型（JOIN）
    indicatorTool?: string; // 检测工具（JOIN）
    unitMeasureName?: string; // 计量单位名称（JOIN）
  }
}

/** 查询检测指标项分页 */
export function getTemplateIndicatorPage(params: PageParam & { templateId?: number }) {
  return requestClient.get<
    PageResult<MesQcTemplateIndicatorApi.TemplateIndicator>
  >('/mes/qc/template/indicator/page', { params });
}

/** 查询检测指标项详情 */
export function getTemplateIndicator(id: number) {
  return requestClient.get<MesQcTemplateIndicatorApi.TemplateIndicator>(
    `/mes/qc/template/indicator/get?id=${id}`,
  );
}

/** 新增检测指标项 */
export function createTemplateIndicator(
  data: MesQcTemplateIndicatorApi.TemplateIndicator,
) {
  return requestClient.post('/mes/qc/template/indicator/create', data);
}

/** 修改检测指标项 */
export function updateTemplateIndicator(
  data: MesQcTemplateIndicatorApi.TemplateIndicator,
) {
  return requestClient.put('/mes/qc/template/indicator/update', data);
}

/** 删除检测指标项 */
export function deleteTemplateIndicator(id: number) {
  return requestClient.delete(`/mes/qc/template/indicator/delete?id=${id}`);
}
