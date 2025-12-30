import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PriceReferenceApi {
  /** 价格参考信息 */
  export interface PriceReference {
    id: string; // ID
    userId: number; // 用户ID
    goodsId: string; // FB商品ID
    source: string; // 来源
    currency: string; // 货币
    formattedAmount: string; // 格式化金额
    priceInt: number; // 金额数值
    priceWithOffset: string; // 汇率金额
    remark: string; // 备注
  }
}

/** 查询价格参考分页 */
export function getPriceReferencePage(params: PageParam) {
  return requestClient.get<PageResult<PriceReferenceApi.PriceReference>>(
    '/mpr/price-reference/page',
    { params },
  );
}
/** 查询价格参考列表 */
export function getPriceReferenceList(goodsId: string) {
  return requestClient.get<PageResult<PriceReferenceApi.PriceReference>>(
    `/mpr/price-reference/list?goodsId=${goodsId}`,
  );
}

/** 查询价格参考详情 */
export function getPriceReference(id: number) {
  return requestClient.get<PriceReferenceApi.PriceReference>(
    `/mpr/price-reference/get?id=${id}`,
  );
}

/** 新增价格参考 */
export function createPriceReference(data: PriceReferenceApi.PriceReference) {
  return requestClient.post('/mpr/price-reference/create', data);
}

/** 修改价格参考 */
export function updatePriceReference(data: PriceReferenceApi.PriceReference) {
  return requestClient.put('/mpr/price-reference/update', data);
}

/** 删除价格参考 */
export function deletePriceReference(id: number) {
  return requestClient.delete(`/mpr/price-reference/delete?id=${id}`);
}

/** 批量删除价格参考 */
export function deletePriceReferenceList(ids: number[]) {
  return requestClient.delete(
    `/mpr/price-reference/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出价格参考 */
export function exportPriceReference(params: any) {
  return requestClient.download('/mpr/price-reference/export-excel', params);
}
