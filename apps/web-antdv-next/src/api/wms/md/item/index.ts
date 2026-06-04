import type { PageParam, PageResult } from '@vben/request';

import type { WmsItemSkuApi } from './sku';

import { requestClient } from '#/api/request';

export namespace WmsItemApi {
  /** WMS 商品 */
  export interface Item {
    id?: number;
    code?: string;
    name?: string;
    categoryId?: number;
    categoryName?: string;
    unit?: string;
    brandId?: number;
    brandName?: string;
    remark?: string;
    skus?: WmsItemSkuApi.ItemSku[];
    createTime?: Date;
  }
}

/** 查询商品分页 */
export function getItemPage(params: PageParam) {
  return requestClient.get<PageResult<WmsItemApi.Item>>('/wms/item/page', {
    params,
  });
}

/** 查询商品精简列表 */
export function getItemSimpleList(params?: any) {
  return requestClient.get<WmsItemApi.Item[]>('/wms/item/simple-list', {
    params,
  });
}

/** 查询商品详情 */
export function getItem(id: number) {
  return requestClient.get<WmsItemApi.Item>(`/wms/item/get?id=${id}`);
}

/** 新增商品 */
export function createItem(data: WmsItemApi.Item) {
  return requestClient.post('/wms/item/create', data);
}

/** 修改商品 */
export function updateItem(data: WmsItemApi.Item) {
  return requestClient.put('/wms/item/update', data);
}

/** 删除商品 */
export function deleteItem(id: number) {
  return requestClient.delete(`/wms/item/delete?id=${id}`);
}

/** 导出商品 */
export function exportItem(params: any) {
  return requestClient.download('/wms/item/export-excel', { params });
}
