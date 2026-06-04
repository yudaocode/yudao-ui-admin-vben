import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesMdProductSipApi {
  /** MES 产品 SIP */
  export interface ProductSip {
    id?: number; // SIP 编号
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

/** 新增产品 SIP */
export function createProductSip(data: MesMdProductSipApi.ProductSip) {
  return requestClient.post('/mes/md/product-sip/create', data);
}

/** 修改产品 SIP */
export function updateProductSip(data: MesMdProductSipApi.ProductSip) {
  return requestClient.put('/mes/md/product-sip/update', data);
}

/** 删除产品 SIP */
export function deleteProductSip(id: number) {
  return requestClient.delete(`/mes/md/product-sip/delete?id=${id}`);
}

/** 查询产品 SIP 详情 */
export function getProductSip(id: number) {
  return requestClient.get<MesMdProductSipApi.ProductSip>(
    `/mes/md/product-sip/get?id=${id}`,
  );
}

/** 查询产品 SIP 分页 */
export function getProductSipPage(params: PageParam) {
  return requestClient.get<PageResult<MesMdProductSipApi.ProductSip>>(
    '/mes/md/product-sip/page',
    { params },
  );
}

/** 根据物料产品编号查询产品 SIP 列表 */
export function getProductSipListByItemId(itemId: number) {
  return requestClient.get<MesMdProductSipApi.ProductSip[]>(
    `/mes/md/product-sip/list-by-item-id?itemId=${itemId}`,
  );
}
