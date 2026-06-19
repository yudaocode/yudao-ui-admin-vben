import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MpFreePublishApi {
  /** 图文文章内容 */
  export interface FreePublishArticle {
    title?: string;
    thumbUrl?: string;
    picUrl?: string;
    url?: string;
  }

  /** 图文内容 */
  export interface FreePublishContent {
    newsItem?: FreePublishArticle[];
  }

  /** 自由发布文章信息 */
  export interface FreePublish {
    id?: number;
    accountId: number;
    mediaId: string;
    articleId: string;
    title: string;
    author: string;
    digest: string;
    content?: FreePublishContent;
    thumbUrl: string;
    status: number;
    publishTime?: Date;
    createTime?: Date;
  }
}

/** 查询自由发布文章列表 */
export function getFreePublishPage(params: PageParam) {
  return requestClient.get<PageResult<MpFreePublishApi.FreePublish>>(
    '/mp/free-publish/page',
    {
      params,
    },
  );
}

/** 删除自由发布文章 */
export function deleteFreePublish(accountId: number, articleId: string) {
  return requestClient.delete('/mp/free-publish/delete', {
    params: { accountId, articleId },
  });
}

/** 发布自由发布文章 */
export function submitFreePublish(accountId: number, mediaId: string) {
  return requestClient.post('/mp/free-publish/submit', null, {
    params: { accountId, mediaId },
  });
}
