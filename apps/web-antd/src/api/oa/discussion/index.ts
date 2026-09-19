import type { PageParam, PageResult } from '@vben/request';

import type { OaDiscussionVoteApi } from './vote';

import { requestClient } from '#/api/request';

export namespace OaDiscussionApi {
  /** OA 讨论 */
  export interface Discussion {
    id?: number; // 讨论编号
    userId?: number; // 发布人用户编号
    userName?: string; // 发布人用户昵称
    type: number; // 讨论类型
    title: string; // 标题
    content?: string; // 内容
    fileUrls: string[]; // 附件地址列表
    visitCount?: number; // 访问次数
    replyCount?: number; // 回复数
    likeCount?: number; // 点赞数
    liked?: boolean; // 当前用户是否已点赞
    likeUserNames?: string[]; // 点赞人用户昵称列表
    voteMultiple?: boolean; // 投票是否允许多选
    voteStartTime?: string; // 投票开始时间
    voteEndTime?: string; // 投票结束时间
    voteOptions?: OaDiscussionVoteApi.VoteOption[]; // 投票选项列表
    createTime?: string; // 创建时间
  }
}

/** 查询讨论分页 */
export function getDiscussionPage(params: PageParam) {
  return requestClient.get<PageResult<OaDiscussionApi.Discussion>>(
    '/oa/discussion/page',
    { params },
  );
}

/** 查询管理范围内的讨论分页 */
export function getDiscussionManagePage(params: PageParam) {
  return requestClient.get<PageResult<OaDiscussionApi.Discussion>>(
    '/oa/discussion/manage-page',
    { params },
  );
}

/** 查询讨论详情，visit 为 true 时记录访问 */
export function getDiscussion(id: number, visit = false) {
  return requestClient.get<OaDiscussionApi.Discussion>('/oa/discussion/get', {
    params: { id, visit },
  });
}

/** 新增讨论 */
export function createDiscussion(data: OaDiscussionApi.Discussion) {
  return requestClient.post<number>('/oa/discussion/create', data);
}

/** 修改讨论 */
export function updateDiscussion(data: OaDiscussionApi.Discussion) {
  return requestClient.put<boolean>('/oa/discussion/update', data);
}

/** 删除讨论 */
export function deleteDiscussion(id: number) {
  return requestClient.delete<boolean>('/oa/discussion/delete', {
    params: { id },
  });
}
