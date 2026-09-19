import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaAnnouncementApi {
  /** OA 公告 */
  export interface Announcement {
    id?: number; // 公告编号
    publisherUserId?: number; // 发布人用户编号
    publisherUserName?: string; // 发布人用户昵称
    publisherDeptId?: number; // 发布人部门编号
    publisherDeptName?: string; // 发布人部门名称
    type: number; // 公告类型
    priority: number; // 优先级
    title: string; // 公告标题
    content?: string; // 公告内容
    url?: string; // 相关链接
    top: boolean; // 是否置顶
    receiverUserIds?: number[]; // 接收人用户编号列表
    receiverUserNames?: string[]; // 接收人用户昵称列表
    readStatus?: boolean; // 当前接收人是否已读
    forwarded?: boolean; // 当前接收人是否已转发给下属
    createTime?: string; // 创建时间
  }
}

/** 查询我发布的公告分页 */
export function getPublishedAnnouncementPage(params: PageParam) {
  return requestClient.get<PageResult<OaAnnouncementApi.Announcement>>(
    '/oa/announcement/published-page',
    { params },
  );
}

/** 查询接收的公告分页 */
export function getReceivedAnnouncementPage(params: PageParam) {
  return requestClient.get<PageResult<OaAnnouncementApi.Announcement>>(
    '/oa/announcement/received-page',
    { params },
  );
}

/** 查询公告详情 */
export function getAnnouncement(id: number) {
  return requestClient.get<OaAnnouncementApi.Announcement>(
    '/oa/announcement/get',
    { params: { id } },
  );
}

/** 新增公告 */
export function createAnnouncement(
  data: Partial<OaAnnouncementApi.Announcement>,
) {
  return requestClient.post<number>('/oa/announcement/create', data);
}

/** 修改公告 */
export function updateAnnouncement(
  data: Partial<OaAnnouncementApi.Announcement>,
) {
  return requestClient.put<boolean>('/oa/announcement/update', data);
}

/** 删除发布的公告 */
export function deleteAnnouncement(id: number) {
  return requestClient.delete<boolean>('/oa/announcement/delete', {
    params: { id },
  });
}

/** 删除接收的公告 */
export function deleteReceivedAnnouncement(id: number) {
  return requestClient.delete<boolean>('/oa/announcement/delete-received', {
    params: { id },
  });
}

/** 标记公告为已读 */
export function updateAnnouncementReadStatus(id: number) {
  return requestClient.put<boolean>(
    '/oa/announcement/update-read-status',
    null,
    { params: { id } },
  );
}

/** 转发公告给直属下属 */
export function forwardAnnouncement(id: number) {
  return requestClient.post<number>('/oa/announcement/forward', null, {
    params: { id },
  });
}
