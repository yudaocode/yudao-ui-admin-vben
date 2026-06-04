import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesProProcessApi {
  /** MES 生产工序 */
  export interface Process {
    id?: number;
    code?: string;
    name?: string;
    attention?: string;
    status?: number;
    remark?: string;
    createTime?: Date;
  }
}

/** 查询生产工序分页 */
export function getProcessPage(params: PageParam) {
  return requestClient.get<PageResult<MesProProcessApi.Process>>(
    '/mes/pro/process/page',
    { params },
  );
}

/** 查询生产工序精简列表 */
export function getProcessSimpleList() {
  return requestClient.get<MesProProcessApi.Process[]>(
    '/mes/pro/process/simple-list',
  );
}

/** 查询生产工序详情 */
export function getProcess(id: number) {
  return requestClient.get<MesProProcessApi.Process>(
    `/mes/pro/process/get?id=${id}`,
  );
}

/** 新增生产工序 */
export function createProcess(data: MesProProcessApi.Process) {
  return requestClient.post('/mes/pro/process/create', data);
}

/** 修改生产工序 */
export function updateProcess(data: MesProProcessApi.Process) {
  return requestClient.put('/mes/pro/process/update', data);
}

/** 删除生产工序 */
export function deleteProcess(id: number) {
  return requestClient.delete(`/mes/pro/process/delete?id=${id}`);
}

/** 导出生产工序 Excel */
export function exportProcess(params: any) {
  return requestClient.download('/mes/pro/process/export-excel', { params });
}
