import type { Dayjs } from 'dayjs';

import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ScheduledTaskApi {
  /** 计划任务信息 */
  export interface ScheduledTask {
    id: string; // ID
    taskId: string; // 任务ID
    description: string; // 说明
    taskData: string; // 任务数据
    assignmentHandler?: string; // assignment_handler
    targetQueue?: string; // target_queue
    taskMsgPersistent: boolean; // task_msg_persistent
    timezone: string; // 时区
    region: string; // 区域
    cityId: number; // 城市ID
    createdAt: Dayjs | string; // 创建时间
    updatedAt: Dayjs | string; // 更新时间
    updateHistory: string; // 更新历史
    startTime: Dayjs | string; // 开始时间
    endTime: Dayjs | string; // 结束时间
    executeTimeRange: string; // 执行时间范围
    frequency: string; // 频率
    status: string; // 状态
    priority: number; // 优先级
    executeCount: number; // 执行次数
  }
}

/** 查询计划任务分页 */
export function getScheduledTaskPage(params: PageParam) {
  return requestClient.get<PageResult<ScheduledTaskApi.ScheduledTask>>(
    '/mpr/scheduled-task/page',
    { params },
  );
}

/** 查询计划任务详情 */
export function getScheduledTask(id: number) {
  return requestClient.get<ScheduledTaskApi.ScheduledTask>(
    `/mpr/scheduled-task/get?id=${id}`,
  );
}

/** 新增计划任务 */
export function createScheduledTask(data: ScheduledTaskApi.ScheduledTask) {
  return requestClient.post('/mpr/scheduled-task/create', data);
}

/** 修改计划任务 */
export function updateScheduledTask(data: ScheduledTaskApi.ScheduledTask) {
  return requestClient.put('/mpr/scheduled-task/update', data);
}

/** 删除计划任务 */
export function deleteScheduledTask(id: number) {
  return requestClient.delete(`/mpr/scheduled-task/delete?id=${id}`);
}

/** 批量删除计划任务 */
export function deleteScheduledTaskList(ids: number[]) {
  return requestClient.delete(
    `/mpr/scheduled-task/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出计划任务 */
export function exportScheduledTask(params: any) {
  return requestClient.download('/mpr/scheduled-task/export-excel', params);
}
