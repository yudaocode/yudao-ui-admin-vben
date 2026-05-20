import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace IoTOtaTaskRecordApi {
  /** IoT OTA 升级任务记录 */
  export interface TaskRecord {
    id?: number;
    firmwareId?: number;
    firmwareVersion?: string;
    taskId?: number;
    deviceId?: string;
    deviceName?: string;
    currentVersion?: string;
    fromFirmwareId?: number;
    fromFirmwareVersion?: string;
    status?: number;
    progress?: number;
    description?: string;
    updateTime?: Date;
  }
}

/** 查询 OTA 升级任务记录分页 */
export function getOtaTaskRecordPage(params: PageParam) {
  return requestClient.get<PageResult<IoTOtaTaskRecordApi.TaskRecord>>(
    '/iot/ota/task/record/page',
    { params },
  );
}

/** 取消 OTA 升级任务记录 */
export function cancelOtaTaskRecord(id: number) {
  return requestClient.put(`/iot/ota/task/record/cancel?id=${id}`);
}

/** 获取 OTA 升级任务记录状态统计 */
export function getOtaTaskRecordStatusStatistics(
  firmwareId?: number,
  taskId?: number,
) {
  return requestClient.get<Record<string, number>>(
    '/iot/ota/task/record/get-status-statistics',
    { params: { firmwareId, taskId } },
  );
}
