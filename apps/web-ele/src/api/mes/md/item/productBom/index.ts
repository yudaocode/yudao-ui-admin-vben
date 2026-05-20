import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesMdProductBomApi {
  /** MES 产品 BOM */
  export interface ProductBom {
    id?: number;
    itemId?: number;
    bomItemId?: number;
    quantity?: number;
    status?: number;
    remark?: string;
    createTime?: Date;
    bomItemCode?: string;
    bomItemName?: string;
    bomItemSpecification?: string;
    unitMeasureName?: string;
    itemOrProduct?: string;
  }
}

/** 创建产品 BOM */
export function createProductBom(data: MesMdProductBomApi.ProductBom) {
  return requestClient.post('/mes/md/product-bom/create', data);
}

/** 更新产品 BOM */
export function updateProductBom(data: MesMdProductBomApi.ProductBom) {
  return requestClient.put('/mes/md/product-bom/update', data);
}

/** 删除产品 BOM */
export function deleteProductBom(id: number) {
  return requestClient.delete(`/mes/md/product-bom/delete?id=${id}`);
}

/** 获得产品 BOM */
export function getProductBom(id: number) {
  return requestClient.get<MesMdProductBomApi.ProductBom>(
    `/mes/md/product-bom/get?id=${id}`,
  );
}

/** 获得产品 BOM 分页 */
export function getProductBomPage(params: PageParam) {
  return requestClient.get<PageResult<MesMdProductBomApi.ProductBom>>(
    '/mes/md/product-bom/page',
    { params },
  );
}

/** 根据物料产品编号获得产品 BOM 列表 */
export function getProductBomListByItemId(itemId: number) {
  return requestClient.get<MesMdProductBomApi.ProductBom[]>(
    `/mes/md/product-bom/list-by-item-id?itemId=${itemId}`,
  );
}
