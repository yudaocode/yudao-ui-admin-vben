import type { Dayjs } from 'dayjs';

import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace RecordApi {
  /** 报警记录信息 */
  export interface Record {
    id: number; // 编号
    sourceType?: string; // 报警来源类型
    sourceId?: number; // 报警来源编号
    sourceName?: string; // 报警来源名称
    targetType?: string; // 报警目标类型
    targetId?: number; // 报警目标编号
    targetName?: string; // 报警目标名称
    type?: string; // 报警类型
    level?: number; // 报警级别
    reason?: string; // 报警原因
    initialAlarmTime?: Dayjs | string; // 初始报警时间
    latestAlarmTime?: Dayjs | string; // 最近报警时间
    viewTime: Dayjs | string; // 查看时间
    confirm: Dayjs | string; // 确认时间
    handleTime: Dayjs | string; // 处理时间
    suspendTime: Dayjs | string; // 暂停时间
    resumeTime: Dayjs | string; // 恢复时间
    completeTime: Dayjs | string; // 完成时间
    archiveTime: Dayjs | string; // 归档时间
    status?: string; // 报警状态
  }
}

/** 查询报警记录分页 */
export function getRecordPage(params: PageParam) {
  return requestClient.get<PageResult<RecordApi.Record>>('/alarm/record/page', {
    params,
  });
}

/** 查询报警记录详情 */
export function getRecord(id: number) {
  return requestClient.get<RecordApi.Record>(`/alarm/record/get?id=${id}`);
}

/** 新增报警记录 */
export function createRecord(data: RecordApi.Record) {
  return requestClient.post('/alarm/record/create', data);
}

/** 修改报警记录 */
export function updateRecord(data: RecordApi.Record) {
  return requestClient.put('/alarm/record/update', data);
}

/** 删除报警记录 */
export function deleteRecord(id: number) {
  return requestClient.delete(`/alarm/record/delete?id=${id}`);
}

/** 批量删除报警记录 */
export function deleteRecordList(ids: number[]) {
  return requestClient.delete(`/alarm/record/delete-list?ids=${ids.join(',')}`);
}

/** 导出报警记录 */
export function exportRecord(params: any) {
  return requestClient.download('/alarm/record/export-excel', params);
}
