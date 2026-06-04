import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesDvMaintenRecordLineApi {
  /** MES 设备保养记录明细 */
  export interface MaintenRecordLine {
    id?: number; // 明细编号
    recordId?: number; // 保养记录编号
    subjectId?: number; // 项目编号
    subjectName?: string; // 项目名称
    subjectContent?: string; // 项目内容
    subjectStandard?: string; // 项目标准
    status?: number; // 保养结果
    result?: string; // 异常描述
    remark?: string; // 备注
  }
}

/** 查询设备保养记录明细分页 */
export function getMaintenRecordLinePage(params: PageParam) {
  return requestClient.get<
    PageResult<MesDvMaintenRecordLineApi.MaintenRecordLine>
  >('/mes/dv/mainten-record-line/page', { params });
}

/** 查询设备保养记录明细详情 */
export function getMaintenRecordLine(id: number) {
  return requestClient.get<MesDvMaintenRecordLineApi.MaintenRecordLine>(
    `/mes/dv/mainten-record-line/get?id=${id}`,
  );
}

/** 新增设备保养记录明细 */
export function createMaintenRecordLine(
  data: MesDvMaintenRecordLineApi.MaintenRecordLine,
) {
  return requestClient.post('/mes/dv/mainten-record-line/create', data);
}

/** 修改设备保养记录明细 */
export function updateMaintenRecordLine(
  data: MesDvMaintenRecordLineApi.MaintenRecordLine,
) {
  return requestClient.put('/mes/dv/mainten-record-line/update', data);
}

/** 删除设备保养记录明细 */
export function deleteMaintenRecordLine(id: number) {
  return requestClient.delete(`/mes/dv/mainten-record-line/delete?id=${id}`);
}
