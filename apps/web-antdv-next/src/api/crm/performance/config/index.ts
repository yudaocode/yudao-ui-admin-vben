import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CrmPerformanceConfigApi {
  /** 业绩目标设置 */
  export interface PerformanceConfig {
    id?: number;
    objectId: number;
    objectName?: string;
    objectType: number;
    year: number | string;
    januaryTargetPrice?: number;
    februaryTargetPrice?: number;
    marchTargetPrice?: number;
    aprilTargetPrice?: number;
    mayTargetPrice?: number;
    juneTargetPrice?: number;
    julyTargetPrice?: number;
    augustTargetPrice?: number;
    septemberTargetPrice?: number;
    octoberTargetPrice?: number;
    novemberTargetPrice?: number;
    decemberTargetPrice?: number;
    bizType: number;
    yearTargetPrice?: number;
    createTime?: Date;
  }
}

export enum PerformanceConfigObjectTypeEnum {
  DEPT = 2,
  USER = 3,
}

/** 查询业绩目标设置分页 */
export function getPerformanceConfigPage(params: PageParam) {
  return requestClient.get<
    PageResult<CrmPerformanceConfigApi.PerformanceConfig>
  >('/crm/performance-config/page', { params });
}

/** 获得业绩目标设置详情 */
export function getPerformanceConfig(id: number) {
  return requestClient.get<CrmPerformanceConfigApi.PerformanceConfig>(
    `/crm/performance-config/get?id=${id}`,
  );
}

/** 新增业绩目标设置 */
export function createPerformanceConfig(
  data: CrmPerformanceConfigApi.PerformanceConfig,
) {
  return requestClient.post('/crm/performance-config/create', data);
}

/** 修改业绩目标设置 */
export function updatePerformanceConfig(
  data: CrmPerformanceConfigApi.PerformanceConfig,
) {
  return requestClient.put('/crm/performance-config/update', data);
}

/** 删除业绩目标设置 */
export function deletePerformanceConfig(id: number) {
  return requestClient.delete(`/crm/performance-config/delete?id=${id}`);
}
