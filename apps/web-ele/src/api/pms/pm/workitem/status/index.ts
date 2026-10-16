import { requestClient } from '#/api/request';

export namespace PmsWorkItemStatusApi {
  /** PMS 工作项看板状态 */
  export interface WorkItemStatus {
    id: number; // 状态编号
    projectId: number; // 项目编号
    workItemType: number; // 工作项类型
    name: string; // 状态名称
    statusType: number; // 语义状态
    description?: string; // 状态描述
    boardName?: string; // 看板列名称，为空时不在看板展示
    defaultStatus: boolean; // 是否初始状态
    sort: number; // 显示顺序
  }

  /** PMS 工作项看板列配置 */
  export interface WorkItemBoard {
    id?: number; // 看板列编号
    name: string; // 看板列名称
    statusIds: number[]; // 关联状态编号列表
  }

  /** PMS 工作项看板配置 */
  export interface WorkItemBoardConfig {
    boards: WorkItemBoard[]; // 看板列列表
    unassignedStatusIds: number[]; // 未放入看板的状态编号列表
  }
}

/** 查询工作项状态详情 */
export function getWorkItemStatus(id: number) {
  return requestClient.get<PmsWorkItemStatusApi.WorkItemStatus>(
    '/pms/pm/work-item-status/get',
    { params: { id } },
  );
}

/** 查询工作项状态列表 */
export function getWorkItemStatusList(projectId: number, type: number) {
  return requestClient.get<PmsWorkItemStatusApi.WorkItemStatus[]>(
    '/pms/pm/work-item-status/list',
    { params: { projectId, type } },
  );
}

/** 新增工作项状态 */
export function createWorkItemStatus(
  data: PmsWorkItemStatusApi.WorkItemStatus,
) {
  return requestClient.post<number>('/pms/pm/work-item-status/create', data);
}

/** 修改工作项状态配置 */
export function updateWorkItemStatusConfig(
  data: PmsWorkItemStatusApi.WorkItemStatus,
) {
  return requestClient.put<boolean>('/pms/pm/work-item-status/update', data);
}

/** 修改默认工作项状态 */
export function updateDefaultWorkItemStatus(id: number) {
  return requestClient.put<boolean>(
    '/pms/pm/work-item-status/update-default',
    null,
    { params: { id } },
  );
}

/** 修改工作项状态顺序 */
export function updateWorkItemStatusSort(statusIds: number[]) {
  return requestClient.put<boolean>('/pms/pm/work-item-status/update-sort', {
    statusIds,
  });
}

/** 查询工作项看板配置 */
export function getWorkItemBoardConfig(projectId: number, type: number) {
  return requestClient.get<PmsWorkItemStatusApi.WorkItemBoardConfig>(
    '/pms/pm/work-item-status/get-board-config',
    { params: { projectId, type } },
  );
}

/** 修改工作项看板配置 */
export function updateWorkItemBoardConfig(
  projectId: number,
  workItemType: number,
  boards: PmsWorkItemStatusApi.WorkItemBoard[],
) {
  return requestClient.put<boolean>(
    '/pms/pm/work-item-status/update-board-config',
    { projectId, workItemType, boards },
  );
}

/** 删除工作项状态 */
export function deleteWorkItemStatus(id: number, transferStatusId?: number) {
  return requestClient.delete<boolean>('/pms/pm/work-item-status/delete', {
    data: { id, transferStatusId },
  });
}
