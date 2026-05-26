import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesProWorkRecordApi {
  /** MES 工作记录流水 */
  export interface WorkRecordLog {
    id?: number; // 编号
    userId?: number; // 用户编号
    userNickname?: string; // 用户昵称
    workstationId?: number; // 工作站编号
    workstationCode?: string; // 工作站编码
    workstationName?: string; // 工作站名称
    type?: number; // 1=上工 2=下工
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }

  /** MES 当前用户工作站绑定状态 */
  export interface MyWorkRecord {
    userId?: number; // 用户编号
    userNickname?: string; // 用户昵称
    workstationId?: number; // 工作站编号
    workstationCode?: string; // 工作站编码
    workstationName?: string; // 工作站名称
    type?: number; // 1=上工 2=下工
    clockInTime?: Date; // 上工时间
    clockOutTime?: Date; // 下工时间
  }
}

/** 查询工作记录分页 */
export function getWorkRecordLogPage(params: PageParam) {
  return requestClient.get<PageResult<MesProWorkRecordApi.WorkRecordLog>>(
    '/mes/pro/workrecord/log/page',
    { params },
  );
}

/** 查询工作记录详情 */
export function getWorkRecordLog(id: number) {
  return requestClient.get<MesProWorkRecordApi.WorkRecordLog>(
    `/mes/pro/workrecord/log/get?id=${id}`,
  );
}

/** 导出工作记录 */
export function exportWorkRecordLog(params: any) {
  return requestClient.download('/mes/pro/workrecord/log/export-excel', {
    params,
  });
}

/** 上工（绑定工作站） */
export function clockInWorkRecord(workstationId: number) {
  return requestClient.put('/mes/pro/workrecord/clock-in', null, {
    params: { workstationId },
  });
}

/** 下工（解绑工作站） */
export function clockOutWorkRecord() {
  return requestClient.put('/mes/pro/workrecord/clock-out');
}

/** 查询当前用户绑定的工作站 */
export function getMyWorkRecord() {
  return requestClient.get<MesProWorkRecordApi.MyWorkRecord>(
    '/mes/pro/workrecord/get-my',
  );
}
