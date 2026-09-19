import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaTaskApi {
  /** OA 任务接收人 */
  export interface TaskReceiver {
    id: number; // 编号
    userId: number; // 接收人用户编号
    userName?: string; // 接收人昵称
    deptName?: string; // 接收人部门名称
    status: number; // 接收状态
    updateTime: string; // 更新时间
  }

  /** OA 任务反馈日志 */
  export interface TaskLog {
    id: number; // 编号
    userId: number; // 反馈人用户编号
    userName?: string; // 反馈人昵称
    status?: number; // 变更后的状态
    content?: string; // 反馈内容
    createTime: string; // 反馈时间
  }

  /** OA 任务 */
  export interface Task {
    id?: number; // 任务编号
    publisherUserId?: number; // 发布人用户编号
    publisherUserName?: string; // 发布人昵称
    publisherDeptName?: string; // 发布人部门名称
    type: number; // 任务类型
    status?: number; // 总体状态
    receiverStatus?: number; // 当前接收人的状态
    title: string; // 标题
    description: string; // 任务描述
    comment?: string; // 任务评价
    startTime: number | string; // 开始时间
    endTime: number | string; // 结束时间
    top?: boolean; // 是否置顶
    canceled?: boolean; // 是否取消
    receiverUserIds: number[]; // 接收人用户编号列表
    receivers?: TaskReceiver[]; // 接收人列表
    logs?: TaskLog[]; // 反馈日志列表
    publishTime?: string; // 发布时间
    createTime?: string; // 创建时间
    updateTime?: string; // 修改时间
  }

  /** OA 任务反馈 */
  export interface TaskFeedback {
    taskId: number; // 任务编号
    publisher: boolean; // 是否从发布管理反馈
    status: number; // 任务状态
    content?: string; // 反馈内容
  }

  /** OA 任务完成排行 */
  export interface TaskRanking {
    userId: number; // 用户编号
    userName?: string; // 用户昵称
    completedCount: number; // 完成任务数量
  }
}

/** 查询我发布的任务分页 */
export function getPublishedTaskPage(params: PageParam) {
  return requestClient.get<PageResult<OaTaskApi.Task>>(
    '/oa/task/published-page',
    { params },
  );
}

/** 查询我的任务分页 */
export function getReceivedTaskPage(params: PageParam) {
  return requestClient.get<PageResult<OaTaskApi.Task>>(
    '/oa/task/received-page',
    { params },
  );
}

/** 查询任务详情 */
export function getTask(id: number) {
  return requestClient.get<OaTaskApi.Task>('/oa/task/get', { params: { id } });
}

/** 新增任务 */
export function createTask(data: Partial<OaTaskApi.Task>) {
  return requestClient.post<number>('/oa/task/create', data);
}

/** 修改任务 */
export function updateTask(data: Partial<OaTaskApi.Task>) {
  return requestClient.put<boolean>('/oa/task/update', data);
}

/** 删除发布的任务 */
export function deleteTask(id: number) {
  return requestClient.delete<boolean>('/oa/task/delete', { params: { id } });
}

/** 删除接收的任务 */
export function deleteReceivedTask(id: number) {
  return requestClient.delete<boolean>('/oa/task/delete-received', {
    params: { id },
  });
}

/** 新增任务反馈 */
export function feedbackTask(data: OaTaskApi.TaskFeedback) {
  return requestClient.post<boolean>('/oa/task/feedback', data);
}

/** 查询我的任务状态统计 */
export function getTaskStatusCount() {
  return requestClient.get<Record<number, number>>('/oa/task/get-status-count');
}

/** 查询任务完成排行 */
export function getCompletedTaskRanking() {
  return requestClient.get<OaTaskApi.TaskRanking[]>(
    '/oa/task/get-completed-ranking',
  );
}
