import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesProTaskApi {
  /** MES 生产任务 */
  export interface Task {
    id?: number;
    code?: string; // 任务编码
    name?: string; // 任务名称
    workOrderId?: number; // 生产工单编号
    workOrderCode?: string; // 工单编码
    workOrderName?: string; // 工单名称
    workstationId?: number; // 工作站编号
    workstationCode?: string; // 工作站编码
    workstationName?: string; // 工作站名称
    routeId?: number; // 工艺路线编号
    processId?: number; // 工序编号
    processName?: string; // 工序名称
    itemId?: number; // 产品物料编号
    itemCode?: string; // 产品编码
    itemName?: string; // 产品名称
    itemSpecification?: string; // 规格型号
    unitMeasureId?: number; // 单位编号
    unitMeasureName?: string; // 单位名称
    quantity?: number; // 排产数量
    producedQuantity?: number; // 已生产数量
    qualifyQuantity?: number; // 合格品数量
    unqualifyQuantity?: number; // 不良品数量
    changedQuantity?: number; // 调整数量
    clientId?: number; // 客户编号
    clientName?: string; // 客户名称
    startTime?: number; // 开始生产时间
    endTime?: number; // 结束生产时间
    duration?: number; // 生产时长（工作日，1=8小时）
    requestDate?: number; // 需求日期（从工单查）
    finishDate?: number; // 完成日期
    cancelDate?: number; // 取消日期
    colorCode?: string; // 甘特图显示颜色
    status?: number; // 任务状态
    checkFlag?: boolean; // 是否质检（派生自工艺路线工序）
    remark?: string; // 备注
  }

  /** MES 生产任务分页查询参数 */
  export interface PageParams extends PageParam {
    code?: string;
    name?: string;
    workOrderId?: number;
    workstationId?: number;
    routeId?: number;
    processId?: number;
    itemId?: number;
    statuses?: number[];
    status?: number;
  }
}

/** 查询生产任务分页 */
export function getTaskPage(params: MesProTaskApi.PageParams) {
  return requestClient.get<PageResult<MesProTaskApi.Task>>(
    '/mes/pro/task/page',
    { params },
  );
}

/** 查询生产任务详情 */
export function getTask(id: number) {
  return requestClient.get<MesProTaskApi.Task>(`/mes/pro/task/get?id=${id}`);
}

/** 新增生产任务 */
export function createTask(data: MesProTaskApi.Task) {
  return requestClient.post('/mes/pro/task/create', data);
}

/** 修改生产任务 */
export function updateTask(data: MesProTaskApi.Task) {
  return requestClient.put('/mes/pro/task/update', data);
}

/** 删除生产任务 */
export function deleteTask(id: number) {
  return requestClient.delete(`/mes/pro/task/delete?id=${id}`);
}

/** 导出生产任务 */
export function exportTask(params: any) {
  return requestClient.download('/mes/pro/task/export-excel', { params });
}

/** 查询甘特图任务列表（非分页） */
export function getGanttTaskList(params: any) {
  return requestClient.get<any[]>('/mes/pro/task/gantt-list', { params });
}
