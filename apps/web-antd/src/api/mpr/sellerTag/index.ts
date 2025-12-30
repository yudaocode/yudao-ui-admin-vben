import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SellerTagApi {
  /** 卖家标签关联信息 */
  export interface SellerTag {
    id: number; // 编号
    sellerId?: string; // 卖家id
    tagId?: number; // 标签id
  }
}

/** 查询卖家标签关联分页 */
export function getSellerTagPage(params: PageParam) {
  return requestClient.get<PageResult<SellerTagApi.SellerTag>>(
    '/mpr/seller-tag/page',
    { params },
  );
}

/** 查询卖家标签关联详情 */
export function getSellerTag(id: number) {
  return requestClient.get<SellerTagApi.SellerTag>(
    `/mpr/seller-tag/get?id=${id}`,
  );
}

/** 新增卖家标签关联 */
export function createSellerTag(data: SellerTagApi.SellerTag) {
  return requestClient.post('/mpr/seller-tag/create', data);
}

/** 修改卖家标签关联 */
export function updateSellerTag(data: SellerTagApi.SellerTag) {
  return requestClient.put('/mpr/seller-tag/update', data);
}

/** 删除卖家标签关联 */
export function deleteSellerTag(id: number) {
  return requestClient.delete(`/mpr/seller-tag/delete?id=${id}`);
}

/** 批量删除卖家标签关联 */
export function deleteSellerTagList(ids: number[]) {
  return requestClient.delete(
    `/mpr/seller-tag/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出卖家标签关联 */
export function exportSellerTag(params: any) {
  return requestClient.download('/mpr/seller-tag/export-excel', params);
}
