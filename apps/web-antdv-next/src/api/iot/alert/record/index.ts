import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace AlertRecordApi {
  /** IoT 告警记录 */
  export interface AlertRecord {
    id?: number;
    configId?: number;
    configName?: string;
    configLevel?: number;
    deviceId?: number;
    productId?: number;
    deviceMessage?: any;
    processStatus?: boolean;
    processRemark?: string;
    createTime?: Date;
  }
}

/** 查询告警记录分页 */
export function getAlertRecordPage(params: PageParam) {
  return requestClient.get<PageResult<AlertRecordApi.AlertRecord>>(
    '/iot/alert-record/page',
    { params },
  );
}

/** 查询告警记录详情 */
export function getAlertRecord(id: number) {
  return requestClient.get<AlertRecordApi.AlertRecord>(
    `/iot/alert-record/get?id=${id}`,
  );
}

/** 处理告警记录 */
export function processAlertRecord(id: number, processRemark?: string) {
  return requestClient.put('/iot/alert-record/process', {
    id,
    processRemark,
  });
}
