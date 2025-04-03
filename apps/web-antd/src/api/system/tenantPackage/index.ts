import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemTenantPackageApi {
  /**
   * 租户套餐信息
   */
  export interface SystemTenantPackage {
    id: number;
    name: string;
    status: number;
    remark: string;
    creator: string;
    updater: string;
    updateTime: string;
    menuIds: number[];
    createTime: Date;
  }
}

/**
 * 租户套餐列表
 */
export function getTenantPackagePage(params: PageParam) {
  return requestClient.get<
    PageResult<SystemTenantPackageApi.SystemTenantPackage>
  >('/system/tenant-package/page', params);
}

/** 查询租户套餐详情 */
export function getTenantPackage(id: number) {
  return requestClient.get(`/system/TenantPackage/get?id=${id}`);
}

/** 新增租户套餐 */
export function createTenantPackage(
  data: SystemTenantPackageApi.SystemTenantPackage,
) {
  return requestClient.post('/system/TenantPackage/create', data);
}

/** 修改租户套餐 */
export function updateTenantPackage(
  data: SystemTenantPackageApi.SystemTenantPackage,
) {
  return requestClient.put('/system/TenantPackage/update', data);
}

/** 删除租户套餐 */
export function deleteTenantPackage(id: number) {
  return requestClient.delete(`/system/TenantPackage/delete?id=${id}`);
}

// 获取租户套餐精简信息列表
export function getTenantPackageList() {
  return requestClient.get('/system/tenant-package/get-simple-list');
}

/** 导出租户套餐 */
export function exportTenantPackage(params: any) {
  return requestClient.download('/system/TenantPackage/export', params);
}
