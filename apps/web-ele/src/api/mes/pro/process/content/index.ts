import { requestClient } from '#/api/request';

export namespace MesProProcessContentApi {
  /** MES 生产工序内容（操作步骤） */
  export interface ProcessContent {
    id?: number;
    processId?: number;
    sort?: number;
    content?: string;
    device?: string;
    material?: string;
    docUrl?: string;
    remark?: string;
    createTime?: Date;
  }
}

/** 按工序编号查询工序内容列表 */
export function getProcessContentListByProcessId(processId: number) {
  return requestClient.get<MesProProcessContentApi.ProcessContent[]>(
    `/mes/pro/process-content/list-by-process?processId=${processId}`,
  );
}

/** 查询工序内容详情 */
export function getProcessContent(id: number) {
  return requestClient.get<MesProProcessContentApi.ProcessContent>(
    `/mes/pro/process-content/get?id=${id}`,
  );
}

/** 新增工序内容 */
export function createProcessContent(
  data: MesProProcessContentApi.ProcessContent,
) {
  return requestClient.post('/mes/pro/process-content/create', data);
}

/** 修改工序内容 */
export function updateProcessContent(
  data: MesProProcessContentApi.ProcessContent,
) {
  return requestClient.put('/mes/pro/process-content/update', data);
}

/** 删除工序内容 */
export function deleteProcessContent(id: number) {
  return requestClient.delete(`/mes/pro/process-content/delete?id=${id}`);
}
