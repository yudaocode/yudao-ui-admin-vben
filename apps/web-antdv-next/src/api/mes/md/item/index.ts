import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesMdItemApi {
  /** MES 物料产品 */
  export interface Item {
    id?: number; // 物料编号
    code?: string; // 物料编码
    name?: string; // 物料名称
    specification?: string; // 规格型号
    unitMeasureId?: number; // 计量单位编号
    unitMeasureName?: string; // 计量单位名称
    itemTypeId?: number; // 物料分类编号
    itemTypeName?: string; // 物料分类名称
    itemOrProduct?: string; // 物料/产品标识
    status?: number; // 状态
    safeStockFlag?: boolean; // 是否启用安全库存
    minStock?: number; // 最低库存量
    maxStock?: number; // 最高库存量
    highValue?: boolean; // 是否高值物料
    batchFlag?: boolean; // 是否启用批次管理
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }

  /** 物料导入结果 */
  export interface ItemImportRespVO {
    createCodes?: string[]; // 新增成功的物料编码
    updateCodes?: string[]; // 更新成功的物料编码
    failureCodes?: Record<string, string>; // 导入失败的物料编码及原因
  }
}

/** 查询物料产品分页 */
export function getItemPage(params: PageParam) {
  return requestClient.get<PageResult<MesMdItemApi.Item>>('/mes/md/item/page', { params });
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
