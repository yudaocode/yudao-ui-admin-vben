import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace BpmOALeaveApi {
  // TODO @ziye：不用 VO 后缀
  export interface LeaveVO {
    id: number;
    status: number;
    type: number;
    reason: string;
    processInstanceId: string;
    startTime: number;
    endTime: number;
    createTime: Date;
    startUserSelectAssignees?: Record<string, string[]>;
  }
}

/** 创建请假申请 */
export async function createLeave(data: BpmOALeaveApi.LeaveVO) {
  return requestClient.post('/bpm/oa/leave/create', data);
}

/** 更新请假申请 */
export async function updateLeave(data: BpmOALeaveApi.LeaveVO) {
  return requestClient.post('/bpm/oa/leave/update', data);
}

/** 获得请假申请 */
export async function getLeave(id: number) {
  return requestClient.get<BpmOALeaveApi.LeaveVO>(`/bpm/oa/leave/get?id=${id}`);
}

/** 获得请假申请分页 */
export async function getLeavePage(params: PageParam) {
  return requestClient.get<PageResult<BpmOALeaveApi.LeaveVO>>(
    '/bpm/oa/leave/page',
    { params },
  );
}
