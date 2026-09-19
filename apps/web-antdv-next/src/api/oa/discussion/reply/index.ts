import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaDiscussionReplyApi {
  /** OA 讨论回复 */
  export interface DiscussionReply {
    id?: number; // 回复编号
    discussionId: number; // 讨论编号
    userId?: number; // 回复人用户编号
    userName?: string; // 回复人用户昵称
    parentId?: number; // 父回复编号
    replyUserId?: number; // 被回复人用户编号
    replyUserName?: string; // 被回复人用户昵称
    content: string; // 回复内容
    likeCount?: number; // 点赞数
    liked?: boolean; // 当前用户是否已点赞
    likeUserNames?: string[]; // 点赞人用户昵称列表
    createTime?: string; // 创建时间
    children?: DiscussionReply[]; // 楼层内的子回复
  }
}

/** 查询讨论回复分页 */
export function getDiscussionReplyPage(params: PageParam) {
  return requestClient.get<PageResult<OaDiscussionReplyApi.DiscussionReply>>(
    '/oa/discussion-reply/page',
    { params },
  );
}

/** 新增讨论回复 */
export function createDiscussionReply(
  data: OaDiscussionReplyApi.DiscussionReply,
) {
  return requestClient.post<number>('/oa/discussion-reply/create', data);
}

/** 删除讨论回复 */
export function deleteDiscussionReply(id: number) {
  return requestClient.delete<boolean>('/oa/discussion-reply/delete', {
    params: { id },
  });
}
