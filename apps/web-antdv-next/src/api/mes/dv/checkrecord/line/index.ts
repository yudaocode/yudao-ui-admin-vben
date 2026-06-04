import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesDvCheckRecordLineApi {
  /** MES 设备点检记录明细 */
  export interface CheckRecordLine {
    id?: number; // 明细编号
    recordId?: number; // 点检记录编号
    subjectId?: number; // 点检项目编号
    subjectCode?: string; // 项目编码
    subjectName?: string; // 项目名称
    subjectContent?: string; // 检查内容
    subjectStandard?: string; // 检查标准
    checkStatus?: number; // 点检结果
    checkResult?: string; // 异常描述
    remark?: string; // 备注
  }
}

/** 查询设备点检记录明细分页 */
export function getCheckRecordLinePage(params: PageParam) {
  return requestClient.get<PageResult<MesDvCheckRecordLineApi.CheckRecordLine>>(
    '/mes/dv/check-record-line/page',
    { params },
  );
}

/** 查询设备点检记录明细详情 */
export function getCheckRecordLine(id: number) {
  return requestClient.get<MesDvCheckRecordLineApi.CheckRecordLine>(
    `/mes/dv/check-record-line/get?id=${id}`,
  );
}

/** 新增设备点检记录明细 */
export function createCheckRecordLine(
  data: MesDvCheckRecordLineApi.CheckRecordLine,
) {
  return requestClient.post('/mes/dv/check-record-line/create', data);
}

/** 修改设备点检记录明细 */
export function updateCheckRecordLine(
  data: MesDvCheckRecordLineApi.CheckRecordLine,
) {
  return requestClient.put('/mes/dv/check-record-line/update', data);
}

/** 删除设备点检记录明细 */
export function deleteCheckRecordLine(id: number) {
  return requestClient.delete(`/mes/dv/check-record-line/delete?id=${id}`);
}
