import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace UserFavoriteApi {
  /** 用户收藏信息 */
  export interface UserFavorite {
    id: string; // ID
    userId: number; // 用户ID
    goodsId: string; // 商品ID
    category: string; // 自定义分类
    tags: string; // 标签
    remark: string; // 备注
  }
}

/** 查询用户收藏分页 */
export function getUserFavoritePage(params: PageParam) {
  return requestClient.get<PageResult<UserFavoriteApi.UserFavorite>>(
    '/mpr/user-favorite/page',
    { params },
  );
}

/** 查询用户收藏详情 */
export function getUserFavorite(id: number) {
  return requestClient.get<UserFavoriteApi.UserFavorite>(
    `/mpr/user-favorite/get?id=${id}`,
  );
}

/** 新增用户收藏 */
export function createUserFavorite(data: UserFavoriteApi.UserFavorite) {
  return requestClient.post('/mpr/user-favorite/create', data);
}

/** 修改用户收藏 */
export function updateUserFavorite(data: UserFavoriteApi.UserFavorite) {
  return requestClient.put('/mpr/user-favorite/update', data);
}

/** 删除用户收藏 */
export function deleteUserFavorite(id: number) {
  return requestClient.delete(`/mpr/user-favorite/delete?id=${id}`);
}

/** 批量删除用户收藏 */
export function deleteUserFavoriteList(ids: number[]) {
  return requestClient.delete(
    `/mpr/user-favorite/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出用户收藏 */
export function exportUserFavorite(params: any) {
  return requestClient.download('/mpr/user-favorite/export-excel', params);
}
