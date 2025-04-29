import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CrmOperateLogApi {
  /** 操作日志查询参数 */
  export interface OperateLogQuery extends PageParam {
    bizType: number;
    bizId: number;
  }

  /** 操作日志信息 */
  export interface OperateLog {
    id: number;
    bizType: number;
    bizId: number;
    type: number;
    content: string;
    creator: string;
    creatorName?: string;
    createTime: Date;
  }
}

/** 获得操作日志 */
export function getOperateLogPage(params: CrmOperateLogApi.OperateLogQuery) {
  return requestClient.get<PageResult<CrmOperateLogApi.OperateLog>>(
    '/crm/operate-log/page',
    { params },
  );
}
