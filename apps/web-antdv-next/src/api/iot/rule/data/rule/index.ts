import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace DataRuleApi {
  /** IoT 数据流转规则 */
  export interface DataRule {
    id?: number;
    name?: string;
    description?: string;
    status?: number;
    sourceConfigs?: any[];
    sinkIds?: number[];
    createTime?: Date;
  }
}

/** 查询数据流转规则分页 */
export function getDataRulePage(params: PageParam) {
  return requestClient.get<PageResult<DataRuleApi.DataRule>>(
    '/iot/data-rule/page',
    { params },
  );
}

/** 查询数据流转规则详情 */
export function getDataRule(id: number) {
  return requestClient.get<DataRuleApi.DataRule>(`/iot/data-rule/get?id=${id}`);
}

/** 新增数据流转规则 */
export function createDataRule(data: DataRuleApi.DataRule) {
  return requestClient.post('/iot/data-rule/create', data);
}

/** 修改数据流转规则 */
export function updateDataRule(data: DataRuleApi.DataRule) {
  return requestClient.put('/iot/data-rule/update', data);
}

/** 删除数据流转规则 */
export function deleteDataRule(id: number) {
  return requestClient.delete(`/iot/data-rule/delete?id=${id}`);
}
