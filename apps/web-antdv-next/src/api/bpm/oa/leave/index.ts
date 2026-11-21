import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace BpmOALeaveApi {
  export interface Leave {
    id: number;
    status: number;
    type: number;
    reason: string;
    processInstanceId: string;
    startTime: number;
    endTime: number;
    createTime: Date;
  }

  export interface LeaveUpdate {
    id: number;
    type?: number;
    startTime?: number;
    endTime?: number;
    reason?: string;
  }
}

/** 创建请假申请 */
export async function createLeave(data: BpmOALeaveApi.Leave) {
  return requestClient.post('/bpm/oa/leave/create', data);
}

/** 更新请假申请，只提交业务编号和修改后的业务字段 */
export async function updateLeave(data: BpmOALeaveApi.LeaveUpdate) {
  return requestClient.put('/bpm/oa/leave/update', data);
}

/** 获得请假申请 */
export async function getLeave(id: number) {
  return requestClient.get<BpmOALeaveApi.Leave>(`/bpm/oa/leave/get?id=${id}`);
}

/** 获得请假申请分页 */
export async function getLeavePage(params: PageParam) {
  return requestClient.get<PageResult<BpmOALeaveApi.Leave>>(
    '/bpm/oa/leave/page',
    { params },
  );
}
