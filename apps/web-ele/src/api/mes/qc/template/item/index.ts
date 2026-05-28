import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesQcTemplateItemApi {
  /** MES 质检方案-产品关联 */
  export interface TemplateItem {
    id?: number; // 编号
    templateId?: number; // 质检方案ID
    itemId?: number; // 产品物料ID
    quantityCheck?: number; // 最低检测数
    quantityUnqualified?: number; // 最大不合格数
    criticalRate?: number; // 最大致命缺陷率（%）
    majorRate?: number; // 最大严重缺陷率（%）
    minorRate?: number; // 最大轻微缺陷率（%）
    remark?: string; // 备注
    itemCode?: string; // 物料编码（JOIN）
    itemName?: string; // 物料名称（JOIN）
    specification?: string; // 规格型号（JOIN）
    unitMeasureName?: string; // 计量单位名称（JOIN）
  }
}

/** 查询产品关联分页 */
export function getTemplateItemPage(params: PageParam & { templateId?: number }) {
  return requestClient.get<PageResult<MesQcTemplateItemApi.TemplateItem>>(
    '/mes/qc/template/item/page',
    { params },
  );
}

/** 查询产品关联详情 */
export function getTemplateItem(id: number) {
  return requestClient.get<MesQcTemplateItemApi.TemplateItem>(
    `/mes/qc/template/item/get?id=${id}`,
  );
}

/** 新增产品关联 */
export function createTemplateItem(data: MesQcTemplateItemApi.TemplateItem) {
  return requestClient.post('/mes/qc/template/item/create', data);
}

/** 修改产品关联 */
export function updateTemplateItem(data: MesQcTemplateItemApi.TemplateItem) {
  return requestClient.put('/mes/qc/template/item/update', data);
}

/** 删除产品关联 */
export function deleteTemplateItem(id: number) {
  return requestClient.delete(`/mes/qc/template/item/delete?id=${id}`);
}
