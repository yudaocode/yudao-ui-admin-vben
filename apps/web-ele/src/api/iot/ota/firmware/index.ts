import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace IoTOtaFirmwareApi {
  /** IoT OTA 固件信息 */
  export interface Firmware {
    id?: number;
    name?: string;
    description?: string;
    version?: string;
    productId?: number;
    productName?: string;
    fileUrl?: string;
    fileSize?: number;
    fileDigestAlgorithm?: string;
    fileDigestValue?: string;
    createTime?: Date;
  }
}

/** 查询 OTA 固件分页 */
export function getOtaFirmwarePage(params: PageParam) {
  return requestClient.get<PageResult<IoTOtaFirmwareApi.Firmware>>(
    '/iot/ota/firmware/page',
    { params },
  );
}

/** 查询 OTA 固件详情 */
export function getOtaFirmware(id: number) {
  return requestClient.get<IoTOtaFirmwareApi.Firmware>(
    `/iot/ota/firmware/get?id=${id}`,
  );
}

/** 新增 OTA 固件 */
export function createOtaFirmware(data: IoTOtaFirmwareApi.Firmware) {
  return requestClient.post('/iot/ota/firmware/create', data);
}

/** 修改 OTA 固件 */
export function updateOtaFirmware(data: IoTOtaFirmwareApi.Firmware) {
  return requestClient.put('/iot/ota/firmware/update', data);
}

/** 删除 OTA 固件 */
export function deleteOtaFirmware(id: number) {
  return requestClient.delete(`/iot/ota/firmware/delete?id=${id}`);
}
