import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace GoodsApi {
  /** 商品信息 */
  export interface Goods {
    id: string; // ID
    goodsId: string; // fb商品ID
    title: string; // 标题
    aiCategory: string; // AI标记的分类
    details: string; // 详情
    processingStatus: string; // 处理状态
  }
  /** Facebook Marketplace 商品URL前缀 */
  export const FB_MP_GOODS_URL = 'https://www.facebook.com/marketplace/item/';
}

/** 查询商品分页 */
export function getGoodsPage(params: PageParam) {
  return requestClient.get<PageResult<GoodsApi.Goods>>('/mpr/goods/page', {
    params,
  });
}

/** 查询商品详情 */
export function getGoods(id: number) {
  return requestClient.get<GoodsApi.Goods>(`/mpr/goods/get?id=${id}`);
}

/** 新增商品 */
export function createGoods(data: GoodsApi.Goods) {
  return requestClient.post('/mpr/goods/create', data);
}

/** 修改商品 */
export function updateGoods(data: GoodsApi.Goods) {
  return requestClient.put('/mpr/goods/update', data);
}

/** 删除商品 */
export function deleteGoods(id: number) {
  return requestClient.delete(`/mpr/goods/delete?id=${id}`);
}

/** 批量删除商品 */
export function deleteGoodsList(ids: number[]) {
  return requestClient.delete(`/mpr/goods/delete-list?ids=${ids.join(',')}`);
}

/** 导出商品 */
export function exportGoods(params: any) {
  return requestClient.download('/mpr/goods/export-excel', params);
}

/** 收藏商品 */
export function favoriteGoods(id: number) {
  return requestClient.get(`/mpr/goods/favorite?id=${id}`);
}
