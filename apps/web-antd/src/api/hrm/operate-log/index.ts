import type { PageResult } from '@vben/request';

import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { requestClient } from '#/api/request';

export namespace HrmOperateLogApi {
  /** 操作日志查询 */
  export interface OperateLogQuery {
    bizType: number;
    bizId: number;
    pageNo?: number;
    pageSize?: number;
  }
}

/** 获得操作日志 */
export function getOperateLogPage(params: HrmOperateLogApi.OperateLogQuery) {
  return requestClient.get<PageResult<SystemOperateLogApi.OperateLog>>(
    '/hrm/operate-log/page',
    { params },
  );
}
