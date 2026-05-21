import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesMdVendorApi {
  /** MES 供应商 */
  export interface Vendor {
    id?: number; // 供应商编号
    code?: string; // 供应商编码
    name?: string; // 供应商名称
    nickname?: string; // 供应商简称
    englishName?: string; // 供应商英文名称
    description?: string; // 供应商简介
    logo?: string; // 供应商 LOGO 地址
    level?: string; // 供应商等级
    score?: number; // 供应商评分
    address?: string; // 供应商地址
    website?: string; // 供应商官网地址
    email?: string; // 供应商邮箱地址
    telephone?: string; // 供应商电话
    contact1Name?: string; // 联系人1
    contact1Telephone?: string; // 联系人1电话
    contact1Email?: string; // 联系人1邮箱
    contact2Name?: string; // 联系人2
    contact2Telephone?: string; // 联系人2电话
    contact2Email?: string; // 联系人2邮箱
    creditCode?: string; // 统一社会信用代码
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }

  /** 供应商导入结果 */
  export interface VendorImportRespVO {
    createCodes?: string[]; // 新增成功的供应商编码
    updateCodes?: string[]; // 更新成功的供应商编码
    failureCodes?: Record<string, string>; // 导入失败的供应商编码及原因
  }
}

/** 查询供应商分页 */
export function getVendorPage(params: PageParam) {
  return requestClient.get<PageResult<MesMdVendorApi.Vendor>>(
    '/mes/md-vendor/page',
    { params },
  );
}

/** 查询供应商详情 */
export function getVendor(id: number) {
  return requestClient.get<MesMdVendorApi.Vendor>(
    `/mes/md-vendor/get?id=${id}`,
  );
}

/** 新增供应商 */
export function createVendor(data: MesMdVendorApi.Vendor) {
  return requestClient.post('/mes/md-vendor/create', data);
}

/** 修改供应商 */
export function updateVendor(data: MesMdVendorApi.Vendor) {
  return requestClient.put('/mes/md-vendor/update', data);
}

/** 删除供应商 */
export function deleteVendor(id: number) {
  return requestClient.delete(`/mes/md-vendor/delete?id=${id}`);
}

/** 导出供应商 */
export function exportVendor(params: any) {
  return requestClient.download('/mes/md-vendor/export-excel', { params });
}

/** 下载供应商导入模板 */
export function importVendorTemplate() {
  return requestClient.download('/mes/md-vendor/get-import-template');
}

/** 导入供应商 */
export function importVendor(file: File, updateSupport: boolean) {
  return requestClient.upload<MesMdVendorApi.VendorImportRespVO>(
    `/mes/md-vendor/import?updateSupport=${updateSupport}`,
    { file },
  );
}
