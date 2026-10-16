import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaScheduleApi {
  /** OA 日程参与人阅读信息 */
  export interface ScheduleParticipant {
    userId: number; // 参与人用户编号
    userName: string; // 参与人用户昵称
    readStatus: boolean; // 是否已读
    readTime?: string; // 首次阅读时间
  }

  /** OA 日程 */
  export interface Schedule {
    id?: number; // 日程编号
    creator?: string; // 创建人用户编号
    creatorName?: string; // 创建人用户昵称
    creatorDeptName?: string; // 发布人部门名称
    type: number; // 日程类型
    priority: number; // 优先级
    title: string; // 标题
    description?: string; // 描述
    startTime: string; // 开始时间
    endTime: string; // 结束时间
    remind: boolean; // 是否提醒
    participantUserIds?: number[]; // 参与人用户编号列表
    participantUserNames?: string[]; // 参与人用户昵称列表
    createTime?: string; // 创建时间
    participants?: ScheduleParticipant[]; // 参与人阅读信息，仅详情返回
  }
}

/** 查询所选范围内的日程分页 */
export function getSchedulePage(params: PageParam) {
  return requestClient.get<PageResult<OaScheduleApi.Schedule>>(
    '/oa/schedule/page',
    { params },
  );
}

/** 查询我的日程分页 */
export function getMySchedulePage(params: PageParam) {
  return requestClient.get<PageResult<OaScheduleApi.Schedule>>(
    '/oa/schedule/my-page',
    { params },
  );
}

/** 查询共享给我的日程分页 */
export function getReceivedSchedulePage(params: PageParam) {
  return requestClient.get<PageResult<OaScheduleApi.Schedule>>(
    '/oa/schedule/received-page',
    { params },
  );
}

/** 查询日程详情 */
export function getSchedule(id: number) {
  return requestClient.get<OaScheduleApi.Schedule>('/oa/schedule/get', {
    params: { id },
  });
}

/** 标记本人已阅读日程 */
export function updateScheduleReadStatus(id: number) {
  return requestClient.put<boolean>('/oa/schedule/update-read-status', null, {
    params: { id },
  });
}

/** 新增日程 */
export function createSchedule(data: Partial<OaScheduleApi.Schedule>) {
  return requestClient.post<number>('/oa/schedule/create', data);
}

/** 修改日程 */
export function updateSchedule(data: Partial<OaScheduleApi.Schedule>) {
  return requestClient.put<boolean>('/oa/schedule/update', data);
}

/** 删除日程 */
export function deleteSchedule(id: number) {
  return requestClient.delete<boolean>('/oa/schedule/delete', {
    params: { id },
  });
}
