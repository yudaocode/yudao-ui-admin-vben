import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesProTaskIssueApi {
  /** MES 生产任务投料 */
  export interface TaskIssue {
    id?: number; // 编号
    taskId?: number; // 生产任务编号
    workOrderId?: number; // 生产工单编号
    workstationId?: number; // 工作站编号
    sourceDocType?: string; // 来源单据类型
    sourceDocId?: number; // 来源单据编号
    sourceLineId?: number; // 来源单据行编号
    sourceDocCode?: string; // 来源单据编码
    batchCode?: string; // 投料批次
    itemId?: number; // 产品物料编号
    itemName?: string; // 产品名称
    itemCode?: string; // 产品编码
    itemSpecification?: string; // 规格型号
    unitMeasureId?: number; // 单位编号
    unitMeasureName?: string; // 单位名称
    issuedQuantity?: number; // 总投料数量
    availableQuantity?: number; // 当前可用数量
    usedQuantity?: number; // 当前使用数量
    remark?: string; // 备注
  }

  /** MES 生产任务投料分页查询参数 */
  export interface PageParams extends PageParam {
    taskId?: number; // 生产任务编号
    workOrderId?: number; // 生产工单编号
    workstationId?: number; // 工作站编号
    itemId?: number; // 产品物料编号
  }
}

/** 查询生产任务投料分页 */
export function getTaskIssuePage(params: MesProTaskIssueApi.PageParams) {
  return requestClient.get<PageResult<MesProTaskIssueApi.TaskIssue>>(
    '/mes/pro/task-issue/page',
    { params },
  );
}

/** 查询生产任务投料详情 */
export function getTaskIssue(id: number) {
  return requestClient.get<MesProTaskIssueApi.TaskIssue>(
    `/mes/pro/task-issue/get?id=${id}`,
  );
}

/** 新增生产任务投料 */
export function createTaskIssue(data: MesProTaskIssueApi.TaskIssue) {
  return requestClient.post('/mes/pro/task-issue/create', data);
}

/** 修改生产任务投料 */
export function updateTaskIssue(data: MesProTaskIssueApi.TaskIssue) {
  return requestClient.put('/mes/pro/task-issue/update', data);
}

/** 删除生产任务投料 */
export function deleteTaskIssue(id: number) {
  return requestClient.delete(`/mes/pro/task-issue/delete?id=${id}`);
}

/** 按生产任务查询投料列表 */
export function getTaskIssueListByTask(taskId: number) {
  return requestClient.get<MesProTaskIssueApi.TaskIssue[]>(
    `/mes/pro/task-issue/list-by-task?taskId=${taskId}`,
  );
}
