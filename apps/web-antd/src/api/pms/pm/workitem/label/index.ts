import { requestClient } from '#/api/request';

export namespace PmsWorkItemLabelApi {
  /** PMS 工作项标签 */
  export interface WorkItemLabel {
    id?: number; // 标签编号
    name: string; // 标签名称
    color: string; // 标签颜色
    createTime?: number; // 创建时间
  }
}

/** 查询工作项标签列表 */
export function getWorkItemLabelList(name?: string) {
  return requestClient.get<PmsWorkItemLabelApi.WorkItemLabel[]>(
    '/pms/pm/work-item-label/list',
    { params: { name } },
  );
}

/** 新增工作项标签 */
export function createWorkItemLabel(data: PmsWorkItemLabelApi.WorkItemLabel) {
  return requestClient.post<number>('/pms/pm/work-item-label/create', data);
}

/** 修改工作项标签 */
export function updateWorkItemLabel(data: PmsWorkItemLabelApi.WorkItemLabel) {
  return requestClient.put<boolean>('/pms/pm/work-item-label/update', data);
}

/** 删除工作项标签 */
export function deleteWorkItemLabel(id: number) {
  return requestClient.delete<boolean>('/pms/pm/work-item-label/delete', {
    params: { id },
  });
}
