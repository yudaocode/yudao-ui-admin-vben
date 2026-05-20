import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesProProcessApi {
  /** MES 生产工序 */
  export interface Process {
    id: number;
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
