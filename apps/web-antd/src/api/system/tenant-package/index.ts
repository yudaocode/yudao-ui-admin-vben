import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemTenantPackageApi {
  /** 租户套餐信息 */
  export interface TenantPackage {
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

/** 租户套餐列表 */
export function getTenantPackagePage(params: PageParam) {
  return requestClient.get<PageResult<SystemTenantPackageApi.TenantPackage>>(
    '/system/tenant-package/page',
    { params, headers: { isVisitTenant: false } },
  );
}

/** 查询租户套餐详情 */
export function getTenantPackage(id: number) {
  return requestClient.get<SystemTenantPackageApi.TenantPackage>(
    `/system/tenant-package/get?id=${id}`,
    { headers: { isVisitTenant: false } },
  );
}

/** 新增租户套餐 */
export function createTenantPackage(
  data: SystemTenantPackageApi.TenantPackage,
) {
  return requestClient.post('/system/tenant-package/create', data, {
    headers: { isVisitTenant: false },
  });
}

/** 修改租户套餐 */
export function updateTenantPackage(
  data: SystemTenantPackageApi.TenantPackage,
) {
  return requestClient.put('/system/tenant-package/update', data, {
    headers: { isVisitTenant: false },
  });
}

/** 删除租户套餐 */
export function deleteTenantPackage(id: number) {
  return requestClient.delete(`/system/tenant-package/delete?id=${id}`);
}

/** 批量删除租户套餐 */
export function deleteTenantPackageList(ids: number[]) {
  return requestClient.delete(
    `/system/tenant-package/delete-list?ids=${ids.join(',')}`,
  );
}

/** 获取租户套餐精简信息列表 */
export function getTenantPackageList() {
  return requestClient.get<SystemTenantPackageApi.TenantPackage[]>(
    '/system/tenant-package/get-simple-list',
  );
}
