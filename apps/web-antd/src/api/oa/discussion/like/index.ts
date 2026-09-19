import { requestClient } from '#/api/request';

/** 点赞讨论或主回复 */
export function createDiscussionLike(discussionId?: number, replyId?: number) {
  return requestClient.post<boolean>('/oa/discussion-like/create', {
    discussionId,
    replyId,
  });
}

/** 取消讨论或主回复点赞 */
export function deleteDiscussionLike(discussionId?: number, replyId?: number) {
  return requestClient.delete<boolean>('/oa/discussion-like/delete', {
    params: { discussionId, replyId },
  });
}
