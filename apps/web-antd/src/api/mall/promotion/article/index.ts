import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MallArticleApi {
  /** 文章管理 */
  export interface Article {
    /** 文章编号 */
    id: number;
    /** 分类编号 */
    categoryId: number;
    /** 文章标题 */
    title: string;
    /** 作者 */
    author: string;
    /** 封面图 */
    picUrl: string;
    /** 文章简介 */
    introduction: string;
    /** 浏览数量 */
    browseCount: string;
    /** 排序 */
    sort: number;
    /** 状态 */
    status: number;
    /** 商品编号 */
    spuId: number;
    /** 是否热门 */
    recommendHot: boolean;
    /** 是否轮播图 */
    recommendBanner: boolean;
    /** 文章内容 */
    content: string;
  }
}

/** 查询文章管理列表 */
export function getArticlePage(params: PageParam) {
  return requestClient.get<PageResult<MallArticleApi.Article>>(
    '/promotion/article/page',
    { params },
  );
}

/** 查询文章管理详情 */
export function getArticle(id: number) {
  return requestClient.get<MallArticleApi.Article>(
    `/promotion/article/get?id=${id}`,
  );
}

/** 新增文章管理 */
export function createArticle(data: MallArticleApi.Article) {
  return requestClient.post('/promotion/article/create', data);
}

/** 修改文章管理 */
export function updateArticle(data: MallArticleApi.Article) {
  return requestClient.put('/promotion/article/update', data);
}

/** 删除文章管理 */
export function deleteArticle(id: number) {
  return requestClient.delete(`/promotion/article/delete?id=${id}`);
}
