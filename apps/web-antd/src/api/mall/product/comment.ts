import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CommentApi {
  /** 商品评论 */
  export interface Comment {
    id: number;
    userId: number;
    userNickname: string;
    userAvatar: string;
    anonymous: boolean;
    orderId: number;
    orderItemId: number;
    spuId: number;
    spuName: string;
    skuId: number;
    visible: boolean;
    scores: number;
    descriptionScores: number;
    benefitScores: number;
    content: string;
    picUrls: string;
    replyStatus: boolean;
    replyUserId: number;
    replyContent: string;
    replyTime: Date;
  }

  /** 评论可见性更新 */
  export interface CommentVisibleUpdate {
    id: number;
    visible: boolean;
  }

  /** 评论回复 */
  export interface CommentReply {
    id: number;
    replyContent: string;
  }
}

/** 查询商品评论列表 */
export function getCommentPage(params: PageParam) {
  return requestClient.get<PageResult<CommentApi.Comment>>(
    '/product/comment/page',
    { params },
  );
}

/** 查询商品评论详情 */
export function getComment(id: number) {
  return requestClient.get<CommentApi.Comment>(`/product/comment/get?id=${id}`);
}

/** 添加自评 */
export function createComment(data: CommentApi.Comment) {
  return requestClient.post('/product/comment/create', data);
}

/** 显示 / 隐藏评论 */
export function updateCommentVisible(data: CommentApi.CommentVisibleUpdate) {
  return requestClient.put('/product/comment/update-visible', data);
}

/** 商家回复 */
export function replyComment(data: CommentApi.CommentReply) {
  return requestClient.put('/product/comment/reply', data);
}
