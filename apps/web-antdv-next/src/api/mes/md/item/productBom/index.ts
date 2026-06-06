import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesMdProductBomApi {
  /** MES 产品 BOM */
  export interface ProductBom {
    id?: number; // BOM 编号
    itemId?: number; // 物料产品编号
    bomItemId?: number; // BOM 物料编号
    quantity?: number; // 物料使用比例
    status?: number; // 是否启用
    remark?: string; // 备注
    createTime?: Date; // 创建时间
    bomItemCode?: string; // BOM 物料编码
    bomItemName?: string; // BOM 物料名称
    bomItemSpecification?: string; // BOM 物料规格
    unitMeasureName?: string; // 计量单位名称
    itemOrProduct?: string; // 物料/产品标识
  }
}

/** 新增产品 BOM */
export function createProductBom(data: MesMdProductBomApi.ProductBom) {
  return requestClient.post('/mes/md/product-bom/create', data);
}

/** 修改产品 BOM */
export function updateProductBom(data: MesMdProductBomApi.ProductBom) {
  return requestClient.put('/mes/md/product-bom/update', data);
}

/** 删除产品 BOM */
export function deleteProductBom(id: number) {
  return requestClient.delete(`/mes/md/product-bom/delete?id=${id}`);
}

/** 查询产品 BOM 详情 */
export function getProductBom(id: number) {
  return requestClient.get<MesMdProductBomApi.ProductBom>(
    `/mes/md/product-bom/get?id=${id}`,
  );
}

/** 查询产品 BOM 分页 */
export function getProductBomPage(params: PageParam) {
  return requestClient.get<PageResult<MesMdProductBomApi.ProductBom>>(
    '/mes/md/product-bom/page',
    { params },
  );
}

/** 根据物料产品编号查询产品 BOM 列表 */
export function getProductBomListByItemId(itemId: number) {
  return requestClient.get<MesMdProductBomApi.ProductBom[]>(
    `/mes/md/product-bom/list-by-item-id?itemId=${itemId}`,
  );
}
