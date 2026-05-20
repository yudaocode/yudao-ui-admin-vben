import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesMdItemApi {
  /** MES 物料产品 */
  export interface Item {
    id?: number;
    code?: string;
    name?: string;
    specification?: string;
    unitMeasureId?: number;
    unitMeasureName?: string;
    itemTypeId?: number;
    itemTypeName?: string;
    itemOrProduct?: string;
    status?: number;
    safeStockFlag?: boolean;
    minStock?: number;
    maxStock?: number;
    highValue?: boolean;
    batchFlag?: boolean;
    remark?: string;
    createTime?: Date;
  }

  /** 物料导入结果 */
  export interface ItemImportRespVO {
    createCodes?: string[];
    updateCodes?: string[];
    failureCodes?: Record<string, string>;
  }
}

/** 查询物料产品分页 */
export function getItemPage(params: PageParam) {
  return requestClient.get<PageResult<MesMdItemApi.Item>>('/mes/md/item/page', {
    params,
  });
}

/** 查询物料产品详情 */
export function getItem(id: number) {
  return requestClient.get<MesMdItemApi.Item>(`/mes/md/item/get?id=${id}`);
}

/** 新增物料产品 */
export function createItem(data: MesMdItemApi.Item) {
  return requestClient.post<number>('/mes/md/item/create', data);
}

/** 修改物料产品 */
export function updateItem(data: MesMdItemApi.Item) {
  return requestClient.put('/mes/md/item/update', data);
}

/** 修改物料产品状态 */
export function updateItemStatus(id: number, status: number) {
  return requestClient.put('/mes/md/item/update-status', undefined, {
    params: { id, status },
  });
}

/** 删除物料产品 */
export function deleteItem(id: number) {
  return requestClient.delete(`/mes/md/item/delete?id=${id}`);
}

/** 导出物料产品 */
export function exportItem(params: any) {
  return requestClient.download('/mes/md/item/export-excel', { params });
}

/** 下载物料导入模板 */
export function importItemTemplate() {
  return requestClient.download('/mes/md/item/get-import-template');
}

/** 导入物料产品 */
export function importItem(file: File, updateSupport: boolean) {
  return requestClient.upload<MesMdItemApi.ItemImportRespVO>(
    `/mes/md/item/import?updateSupport=${updateSupport}`,
    { file },
  );
}
