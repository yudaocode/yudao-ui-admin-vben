import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesMdProductSopApi {
  /** MES 产品 SOP */
  export interface ProductSop {
    id?: number;
    itemId?: number;
    sort?: number;
    processId?: number;
    title?: string;
    description?: string;
    url?: string;
    remark?: string;
    createTime?: Date;
    processCode?: string;
    processName?: string;
  }
}

/** 创建产品 SOP */
export function createProductSop(data: MesMdProductSopApi.ProductSop) {
  return requestClient.post('/mes/md/product-sop/create', data);
}

/** 更新产品 SOP */
export function updateProductSop(data: MesMdProductSopApi.ProductSop) {
  return requestClient.put('/mes/md/product-sop/update', data);
}

/** 删除产品 SOP */
export function deleteProductSop(id: number) {
  return requestClient.delete(`/mes/md/product-sop/delete?id=${id}`);
}

/** 获得产品 SOP */
export function getProductSop(id: number) {
  return requestClient.get<MesMdProductSopApi.ProductSop>(
    `/mes/md/product-sop/get?id=${id}`,
  );
}

/** 获得产品 SOP 分页 */
export function getProductSopPage(params: PageParam) {
  return requestClient.get<PageResult<MesMdProductSopApi.ProductSop>>(
    '/mes/md/product-sop/page',
    { params },
  );
}

/** 根据物料产品编号获得产品 SOP 列表 */
export function getProductSopListByItemId(itemId: number) {
  return requestClient.get<MesMdProductSopApi.ProductSop[]>(
    `/mes/md/product-sop/list-by-item-id?itemId=${itemId}`,
  );
}
