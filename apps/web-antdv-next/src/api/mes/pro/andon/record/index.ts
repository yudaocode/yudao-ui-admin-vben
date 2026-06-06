import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesProAndonRecordApi {
  /** MES 安灯记录 */
  export interface AndonRecord {
    id?: number;
    configId?: number; // 安灯配置编号
    workstationId?: number; // 工作站编号
    workstationCode?: string; // 工作站编码
    workstationName?: string; // 工作站名称
    workOrderId?: number; // 生产工单编号
    workOrderCode?: string; // 工单编码
    processId?: number; // 工序编号
    processName?: string; // 工序名称
    userId?: number; // 发起用户编号
    userNickname?: string; // 发起人昵称
    reason?: string; // 呼叫原因
    level?: number; // 级别
    status?: number; // 处置状态
    handleTime?: number; // 处置时间（毫秒时间戳）
    handlerUserId?: number; // 处置人编号
    handlerUserNickname?: string; // 处置人昵称
    remark?: string; // 备注
    createTime?: number; // 发起时间
  }

  /** MES 安灯记录分页查询参数 */
  export interface PageParams extends PageParam {
    workstationId?: number; // 工作站编号
    userId?: number; // 发起用户编号
    handlerUserId?: number; // 处置人编号
    status?: number; // 处置状态
    createTime?: string[]; // 发起时间区间
  }
}

/** 查询安灯记录分页 */
export function getAndonRecordPage(params: MesProAndonRecordApi.PageParams) {
  return requestClient.get<PageResult<MesProAndonRecordApi.AndonRecord>>(
    '/mes/pro/andon-record/page',
    { params },
  );
}

/** 查询安灯记录详情 */
export function getAndonRecord(id: number) {
  return requestClient.get<MesProAndonRecordApi.AndonRecord>(
    `/mes/pro/andon-record/get?id=${id}`,
  );
}

/** 新增安灯记录 */
export function createAndonRecord(data: MesProAndonRecordApi.AndonRecord) {
  return requestClient.post('/mes/pro/andon-record/create', data);
}

/** 删除安灯记录 */
export function deleteAndonRecord(id: number) {
  return requestClient.delete(`/mes/pro/andon-record/delete?id=${id}`);
}

/** 更新安灯记录（保存/已处置） */
export function updateAndonRecord(data: MesProAndonRecordApi.AndonRecord) {
  return requestClient.put('/mes/pro/andon-record/update', data);
}

/** 导出安灯记录 Excel */
export function exportAndonRecord(
  params: Partial<MesProAndonRecordApi.PageParams>,
) {
  return requestClient.download('/mes/pro/andon-record/export-excel', {
    params,
  });
}
