import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace BpmTaskApi {
  /** BPM 流程监听器 VO */
  export interface TaskVO {
    id: number; // 编号
    name: string; // 监听器名字
    type: string; // 监听器类型
    status: number; // 监听器状态
    event: string; // 监听事件
    valueType: string; // 监听器值类型
    value: string; // 监听器值
  }
}

/** 查询待办任务分页 */
export async function getTaskTodoPage(params: PageParam) {
  return requestClient.get<PageResult<BpmTaskApi.TaskVO>>(
    '/bpm/task/todo-page',
    {
      params,
    },
  );
}

/** 查询已办任务分页 */
export async function getTaskDonePage(params: PageParam) {
  return requestClient.get<PageResult<BpmTaskApi.TaskVO>>(
    '/bpm/task/done-page',
    {
      params,
    },
  );
}

/** 查询任务管理分页 */
export async function getTaskManagerPage(params: PageParam) {
  return requestClient.get<PageResult<BpmTaskApi.TaskVO>>(
    '/bpm/task/manager-page',
    { params },
  );
}

/** 审批任务 */
export const approveTask = async (data: any) => {
  return await requestClient.put('/bpm/task/approve', data);
};

/** 驳回任务 */
export const rejectTask = async (data: any) => {
  return await requestClient.put('/bpm/task/reject', data);
};

/** 根据流程实例 ID 查询任务列表 */
export const getTaskListByProcessInstanceId = async (data: any) => {
  return await requestClient.get('/bpm/task/list-by-process-instance-id', data);
};

/** 获取所有可退回的节点 */
export const getTaskListByReturn = async (data: any) => {
  return await requestClient.get('/bpm/task/list-by-return', data);
};

/** 退回 */
export const returnTask = async (data: any) => {
  return await requestClient.put('/bpm/task/return', data);
};

// 委派
export const delegateTask = async (data: any) => {
  return await requestClient.put('/bpm/task/delegate', data);
};

// 转派
export const transferTask = async (data: any) => {
  return await requestClient.put('/bpm/task/transfer', data);
};

// 加签
export const signCreateTask = async (data: any) => {
  return await requestClient.put('/bpm/task/create-sign', data);
};

// 减签
export const signDeleteTask = async (data: any) => {
  return await requestClient.delete('/bpm/task/delete-sign', data);
};

// 抄送
export const copyTask = async (data: any) => {
  return await requestClient.put('/bpm/task/copy', data);
};

// 获取我的待办任务
export const myTodoTask = async (processInstanceId: string) => {
  return await requestClient.get(
    `/bpm/task/my-todo?processInstanceId=${processInstanceId}`,
  );
};

// 获取加签任务列表
export const getChildrenTaskList = async (id: string) => {
  return await requestClient.get(
    `/bpm/task/list-by-parent-task-id?parentTaskId=${id}`,
  );
};
