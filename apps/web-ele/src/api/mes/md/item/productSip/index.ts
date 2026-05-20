import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesMdProductSipApi {
  /** MES 产品 SIP */
  export interface ProductSip {
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

/** 创建产品 SIP */
export function createProductSip(data: MesMdProductSipApi.ProductSip) {
  return requestClient.post('/mes/md/product-sip/create', data);
}

/** 更新产品 SIP */
export function updateProductSip(data: MesMdProductSipApi.ProductSip) {
  return requestClient.put('/mes/md/product-sip/update', data);
}

/** 删除产品 SIP */
export function deleteProductSip(id: number) {
  return requestClient.delete(`/mes/md/product-sip/delete?id=${id}`);
}

/** 获得产品 SIP */
export function getProductSip(id: number) {
  return requestClient.get<MesMdProductSipApi.ProductSip>(
    `/mes/md/product-sip/get?id=${id}`,
  );
}

/** 获得产品 SIP 分页 */
export function getProductSipPage(params: PageParam) {
  return requestClient.get<PageResult<MesMdProductSipApi.ProductSip>>(
    '/mes/md/product-sip/page',
    { params },
  );
}

/** 根据物料产品编号获得产品 SIP 列表 */
export function getProductSipListByItemId(itemId: number) {
  return requestClient.get<MesMdProductSipApi.ProductSip[]>(
    `/mes/md/product-sip/list-by-item-id?itemId=${itemId}`,
  );
}
