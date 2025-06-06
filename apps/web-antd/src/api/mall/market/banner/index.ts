import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace BannerApi {
  /** Banner 信息 */
  export interface Banner {
    id: number;
    title: string;
    picUrl: string;
    status: number;
    url: string;
    position: number;
    sort: number;
    memo: string;
  }
}

/** 查询Banner管理列表 */
export function getBannerPage(params: PageParam) {
  return requestClient.get<PageResult<BannerApi.Banner>>(
    '/promotion/banner/page',
    { params },
  );
}

/** 查询Banner管理详情 */
export function getBanner(id: number) {
  return requestClient.get<BannerApi.Banner>(`/promotion/banner/get?id=${id}`);
}

/** 新增Banner管理 */
export function createBanner(data: BannerApi.Banner) {
  return requestClient.post('/promotion/banner/create', data);
}

/** 修改Banner管理 */
export function updateBanner(data: BannerApi.Banner) {
  return requestClient.put('/promotion/banner/update', data);
}

/** 删除Banner管理 */
export function deleteBanner(id: number) {
  return requestClient.delete(`/promotion/banner/delete?id=${id}`);
}
