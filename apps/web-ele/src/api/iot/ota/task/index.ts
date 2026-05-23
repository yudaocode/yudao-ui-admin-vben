import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace IoTOtaTaskApi {
  /** IoT OTA 升级任务 */
  export interface Task {
    id?: number;
    name?: string;
    description?: string;
    firmwareId?: number;
    status?: number;
    deviceScope?: number;
    deviceIds?: number[];
    deviceTotalCount?: number;
    deviceSuccessCount?: number;
    createTime?: Date;
  }
}

/** 查询 OTA 升级任务分页 */
export function getOtaTaskPage(params: PageParam) {
  return requestClient.get<PageResult<IoTOtaTaskApi.Task>>(
    '/iot/ota/task/page',
    { params },
  );
}

/** 查询 OTA 升级任务详情 */
export function getOtaTask(id: number) {
  return requestClient.get<IoTOtaTaskApi.Task>(`/iot/ota/task/get?id=${id}`);
}

/** 新增 OTA 升级任务 */
export function createOtaTask(data: IoTOtaTaskApi.Task) {
  return requestClient.post('/iot/ota/task/create', data);
}

/** 取消 OTA 升级任务 */
export function cancelOtaTask(id: number) {
  return requestClient.post(`/iot/ota/task/cancel?id=${id}`);
}
