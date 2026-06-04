import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace WmsItemSkuApi {
  /** WMS 商品 SKU */
  export interface ItemSku {
    id?: number;
    name?: string;
    itemId?: number;
    itemCode?: string;
    itemName?: string;
    categoryId?: number;
    categoryName?: string;
    unit?: string;
    brandId?: number;
    brandName?: string;
    barCode?: string;
    code?: string;
    length?: number;
    width?: number;
    height?: number;
    grossWeight?: number;
    netWeight?: number;
    costPrice?: number;
    sellingPrice?: number;
    createTime?: Date;
  }
}

/** 按 SKU 维度分页（支持商品 / 品牌 / 分类多表联查筛选） */
export function getItemSkuPage(params: PageParam) {
  return requestClient.get<PageResult<WmsItemSkuApi.ItemSku>>(
    '/wms/item-sku/page',
    { params },
  );
}
