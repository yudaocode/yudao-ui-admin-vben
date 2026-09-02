import type { PageParam, PageResult } from '@vben/request';

import type { PmsWorkItemLabelApi } from './label';
import type { PmsWorkItemStatusApi } from './status';

import { requestClient } from '#/api/request';

export namespace PmsWorkItemApi {
  /** PMS 工作项 */
  export interface WorkItem {
    id?: number; // 工作项编号
    projectId: number; // 项目编号
    type: number; // 工作项类型
    serialNumber?: number; // 项目内工作项序号
    name: string; // 工作项标题
    description?: string; // 工作项描述
    priority: number; // 优先级
    assigneeUserId?: number; // 负责人用户编号
    assigneeUserName?: string; // 负责人姓名
    memberUserIds: number[]; // 参与人用户编号列表
    memberUserNames?: string[]; // 参与人姓名列表
    statusId?: number; // 看板状态编号
    statusName?: string; // 看板状态名称
    status?: number; // 语义状态
    lifecycleStatus?: number; // 生命周期状态，1 正常，2 已归档，3 回收站
    archiveTime?: number; // 归档时间
    recycleTime?: number; // 移入回收站时间
    iterationId?: number; // 所属迭代编号
    iterationName?: string; // 所属迭代名称
    parentId?: number; // 父工作项编号
    relatedRequirementId?: number; // 关联需求编号
    relatedRequirementName?: string; // 关联需求标题
    defectType?: number; // 缺陷类型
    startTime?: number | string; // 开始时间
    endTime?: number | string; // 截止时间
    estimatedHours?: number; // 预估工时
    progress?: number; // 完成进度
    fileUrls: string[]; // 附件地址列表
    labelIds?: number[]; // 标签编号列表
    labels?: PmsWorkItemLabelApi.WorkItemLabel[]; // 标签列表
    childWorkItemNames?: string[]; // 创建时同时新增的子工作项标题列表
    actualHours?: number; // 创建时登记的实际投入工时
    remainingHours?: number; // 创建时登记的剩余工时
    sort?: number; // 看板内显示顺序
    createTime?: number; // 创建时间
  }

  /** PMS 工作项看板列 */
  export interface WorkItemBoard {
    id: number; // 看板列编号
    name: string; // 看板列名称
    statuses: PmsWorkItemStatusApi.WorkItemStatus[]; // 映射到当前列的状态列表
    items: WorkItem[]; // 工作项列表
  }


  /** PMS 工作项导入结果（已解包外层响应） */
  export interface WorkItemImportResult {
    successCount: number; // 导入成功数量
    failureReasons: Record<number, string>; // 导入失败行及原因
  }

  /** PMS 工作项导入响应 */
  export interface WorkItemImportResp {
    code: number; // 响应码
    msg: string; // 响应消息
    /** 导入结果 */
    data: {
      failureReasons: Record<number, string>; // 导入失败行及原因
      successCount: number; // 导入成功数量
    };
  }
}

/** 查询工作项分页 */
export function getWorkItemPage(params: PageParam) {
  return requestClient.get<PageResult<PmsWorkItemApi.WorkItem>>(
    '/pms/pm/work-item/page',
    { params },
  );
}

/** 查询工作项详情 */
export function getWorkItem(id: number) {
  return requestClient.get<PmsWorkItemApi.WorkItem>('/pms/pm/work-item/get', {
    params: { id },
  });
}

/** 查询工作项看板 */
export function getWorkItemBoard(params: any) {
  return requestClient.get<PmsWorkItemApi.WorkItemBoard[]>(
    '/pms/pm/work-item/board',
    { params },
  );
}

/** 新增工作项 */
export function createWorkItem(data: PmsWorkItemApi.WorkItem) {
  return requestClient.post<number>('/pms/pm/work-item/create', data);
}

/** 修改工作项 */
export function updateWorkItem(data: PmsWorkItemApi.WorkItem) {
  return requestClient.put<boolean>('/pms/pm/work-item/update', data);
}

/** 修改工作项名称 */
export function updateWorkItemName(id: number, name: string) {
  return requestClient.put<boolean>('/pms/pm/work-item/update-name', {
    id,
    name,
  });
}

/** 修改工作项状态 */
export function updateWorkItemStatus(id: number, statusId: number) {
  return requestClient.put<boolean>('/pms/pm/work-item/update-status', {
    id,
    statusId,
  });
}

/** 修改工作项所属迭代 */
export function updateWorkItemIteration(id: number, iterationId?: number) {
  return requestClient.put<boolean>('/pms/pm/work-item/update-iteration', {
    id,
    iterationId,
  });
}

/** 修改看板工作项顺序 */
export function updateWorkItemSort(statusId: number, workItemIds: number[]) {
  return requestClient.put<boolean>('/pms/pm/work-item/update-sort', {
    statusId,
    workItemIds,
  });
}

/** 修改待规划工作项个人顺序 */
export function updateWorkItemPlanningSort(
  projectId: number,
  iterationId: number | undefined,
  workItemIds: number[],
) {
  return requestClient.put<boolean>('/pms/pm/work-item/update-planning-sort', {
    projectId,
    iterationId,
    workItemIds,
  });
}

/** 归档工作项 */
export function archiveWorkItem(id: number) {
  return requestClient.put<boolean>('/pms/pm/work-item/archive', null, {
    params: { id },
  });
}

/** 将工作项移入回收站 */
export function recycleWorkItem(id: number) {
  return requestClient.put<boolean>('/pms/pm/work-item/recycle', null, {
    params: { id },
  });
}

/** 恢复回收站工作项 */
export function restoreWorkItem(id: number) {
  return requestClient.put<boolean>('/pms/pm/work-item/restore', null, {
    params: { id },
  });
}

/** 彻底删除回收站工作项 */
export function deleteWorkItem(id: number) {
  return requestClient.delete<boolean>('/pms/pm/work-item/delete', {
    params: { id },
  });
}

/** 导入工作项 */
export function importWorkItem(projectId: number, type: number, file: File) {
  return requestClient.upload<PmsWorkItemApi.WorkItemImportResult>(
    '/pms/pm/work-item/import',
    { projectId, type, file },
  );
}

/** 导出工作项 Excel */
export function exportWorkItemList(params: PageParam) {
  return requestClient.download('/pms/pm/work-item/export-excel', { params });
}

/** 下载工作项导入模板 */
export function getWorkItemImportTemplate() {
  return requestClient.download('/pms/pm/work-item/get-import-template');
}
