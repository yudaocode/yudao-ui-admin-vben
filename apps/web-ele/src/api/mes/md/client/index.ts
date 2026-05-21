import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesMdClientApi {
  /** MES 客户 */
  export interface Client {
    id?: number; // 客户编号
    code?: string; // 客户编码
    name?: string; // 客户名称
    nickname?: string; // 客户简称
    englishName?: string; // 客户英文名称
    description?: string; // 客户简介
    logo?: string; // 客户 LOGO 地址
    type?: number; // 客户类型
    address?: string; // 客户地址
    website?: string; // 客户官网地址
    email?: string; // 客户邮箱地址
    telephone?: string; // 客户电话
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

  /** 客户导入结果 */
  export interface ClientImportRespVO {
    createCodes?: string[]; // 新增成功的客户编码
    updateCodes?: string[]; // 更新成功的客户编码
    failureCodes?: Record<string, string>; // 导入失败的客户编码及原因
  }
}

/** 查询客户分页 */
export function getClientPage(params: PageParam) {
  return requestClient.get<PageResult<MesMdClientApi.Client>>(
    '/mes/md-client/page',
    { params },
  );
}

/** 查询客户详情 */
export function getClient(id: number) {
  return requestClient.get<MesMdClientApi.Client>(
    `/mes/md-client/get?id=${id}`,
  );
}

/** 新增客户 */
export function createClient(data: MesMdClientApi.Client) {
  return requestClient.post('/mes/md-client/create', data);
}

/** 修改客户 */
export function updateClient(data: MesMdClientApi.Client) {
  return requestClient.put('/mes/md-client/update', data);
}

/** 删除客户 */
export function deleteClient(id: number) {
  return requestClient.delete(`/mes/md-client/delete?id=${id}`);
}

/** 导出客户 */
export function exportClient(params: any) {
  return requestClient.download('/mes/md-client/export-excel', { params });
}

/** 下载客户导入模板 */
export function importClientTemplate() {
  return requestClient.download('/mes/md-client/get-import-template');
}

/** 导入客户 */
export function importClient(file: File, updateSupport: boolean) {
  return requestClient.upload<MesMdClientApi.ClientImportRespVO>(
    `/mes/md-client/import?updateSupport=${updateSupport}`,
    { file },
  );
}
