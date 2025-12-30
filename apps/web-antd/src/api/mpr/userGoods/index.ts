import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace UserGoodsApi {
  /** 用户商品信息 */
  export interface UserGoods {
    id: string; // ID
    userId: number; // 用户ID
    goodsId: string; // 商品ID
    goodsPhase: number; // 商品阶段
    assistantId: number; // 是否粗筛
    keywordId: number; // 是否目标
    isCandidate: number; // 是否意向
    tags: string; // 标签
    remark: string; // 用户备注
    favorite: object;
  }
}

/** 查询用户商品分页 */
export function getUserGoodsPage(params: PageParam) {
  return requestClient.get<PageResult<UserGoodsApi.UserGoods>>(
    '/mpr/user-goods/page',
    { params },
  );
}

/** 查询用户商品详情 */
export function getUserGoods(id: number) {
  return requestClient.get<UserGoodsApi.UserGoods>(
    `/mpr/user-goods/get?id=${id}`,
  );
}

/** 新增用户商品 */
export function createUserGoods(data: UserGoodsApi.UserGoods) {
  return requestClient.post('/mpr/user-goods/create', data);
}

/** 修改用户商品 */
export function updateUserGoods(data: UserGoodsApi.UserGoods) {
  return requestClient.put('/mpr/user-goods/update', data);
}

/** 删除用户商品 */
export function deleteUserGoods(id: number) {
  return requestClient.delete(`/mpr/user-goods/delete?id=${id}`);
}

/** 批量删除用户商品 */
export function deleteUserGoodsList(ids: number[]) {
  return requestClient.delete(
    `/mpr/user-goods/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出用户商品 */
export function exportUserGoods(params: any) {
  return requestClient.download('/mpr/user-goods/export-excel', params);
}
