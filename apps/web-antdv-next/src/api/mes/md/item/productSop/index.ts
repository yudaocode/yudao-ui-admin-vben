import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesMdProductSopApi {
  /** MES 产品 SOP */
  export interface ProductSop {
    id?: number; // SOP 编号
    itemId?: number; // 物料产品编号
    sort?: number; // 排列顺序
    processId?: number; // 工序编号
    title?: string; // 标题
    description?: string; // 详细描述
    url?: string; // 图片地址
    remark?: string; // 备注
    createTime?: Date; // 创建时间
    processCode?: string; // 工序编码
    processName?: string; // 工序名称
  }
}

/** 新增产品 SOP */
export function createProductSop(data: MesMdProductSopApi.ProductSop) {
  return requestClient.post('/mes/md/product-sop/create', data);
}

/** 修改产品 SOP */
export function updateProductSop(data: MesMdProductSopApi.ProductSop) {
  return requestClient.put('/mes/md/product-sop/update', data);
}

/** 删除产品 SOP */
export function deleteProductSop(id: number) {
  return requestClient.delete(`/mes/md/product-sop/delete?id=${id}`);
}

/** 查询产品 SOP 详情 */
export function getProductSop(id: number) {
  return requestClient.get<MesMdProductSopApi.ProductSop>(
    `/mes/md/product-sop/get?id=${id}`,
  );
}

/** 查询产品 SOP 分页 */
export function getProductSopPage(params: PageParam) {
  return requestClient.get<PageResult<MesMdProductSopApi.ProductSop>>(
    '/mes/md/product-sop/page',
    { params },
  );
}

/** 根据物料产品编号查询产品 SOP 列表 */
export function getProductSopListByItemId(itemId: number) {
  return requestClient.get<MesMdProductSopApi.ProductSop[]>(
    `/mes/md/product-sop/list-by-item-id?itemId=${itemId}`,
  );
}
