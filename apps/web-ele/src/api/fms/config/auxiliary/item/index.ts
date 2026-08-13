import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace FmsAuxiliaryItemApi {
  /** 辅助核算项目 */
  export interface AuxiliaryItem {
    id?: number; // 项目编号
    accountSetId: number; // 账套编号
    auxiliaryTypeId?: number; // 辅助核算类别编号
    code: string; // 项目编码
    name: string; // 项目名称
    status?: number; // 状态
    remark?: string; // 备注
    specification?: string; // 规格
    unit?: string; // 单位
    createTime?: Date; // 创建时间
  }

  /** 辅助核算项目下拉选项 */
  export type AuxiliaryItemOption = AuxiliaryItem & { id: number };

  /** 辅助核算项目分页查询参数 */
  export interface PageReq extends PageParam {
    accountSetId: number; // 账套编号
    auxiliaryTypeId: number; // 辅助核算类别编号
    search?: string; // 关键词
  }

  /** 辅助核算项目导入结果 */
  export interface ImportResp {
    totalCount: number; // 总数量
    successItemCodes: string[]; // 成功项目编码数组
    failureReasons: Record<string, string>; // 失败原因 Map
  }
}

/** 查询辅助核算项目分页 */
export function getAuxiliaryItemPage(params: FmsAuxiliaryItemApi.PageReq) {
  return requestClient.get<PageResult<FmsAuxiliaryItemApi.AuxiliaryItem[]>>(
    '/fms/config/auxiliary-item/page',
    { params },
  );
}

/** 查询辅助核算项目精简列表 */
export function getAuxiliaryItemSimpleList(
  accountSetId: number,
  auxiliaryTypeId: number,
) {
  return requestClient.get<FmsAuxiliaryItemApi.AuxiliaryItemOption[]>(
    '/fms/config/auxiliary-item/simple-list',
    { params: { accountSetId, auxiliaryTypeId } },
  );
}

/** 新增辅助核算项目 */
export function createAuxiliaryItem(data: FmsAuxiliaryItemApi.AuxiliaryItem) {
  return requestClient.post<number>('/fms/config/auxiliary-item/create', data);
}

/** 修改辅助核算项目 */
export function updateAuxiliaryItem(data: FmsAuxiliaryItemApi.AuxiliaryItem) {
  return requestClient.put<boolean>('/fms/config/auxiliary-item/update', data);
}

/** 批量删除辅助核算项目 */
export function deleteAuxiliaryItemList(accountSetId: number, ids: number[]) {
  return requestClient.delete<boolean>('/fms/config/auxiliary-item/delete-list', {
    params: { accountSetId, ids: ids.join(',') },
  });
}

/** 修改辅助核算项目状态 */
export function updateAuxiliaryItemStatus(
  accountSetId: number,
  id: number,
  status: number,
) {
  return requestClient.put<boolean>('/fms/config/auxiliary-item/update-status', {
    accountSetId,
    id,
    status,
  });
}

/** 导出辅助核算项目 Excel */
export function exportAuxiliaryItem(params: FmsAuxiliaryItemApi.PageReq) {
  return requestClient.download('/fms/config/auxiliary-item/export-excel', {
    params,
  });
}

/** 下载辅助核算项目导入模板 */
export function getAuxiliaryItemImportTemplate(type: number) {
  return requestClient.download(
    '/fms/config/auxiliary-item/get-import-template',
    { params: { type } },
  );
}

/** 导入辅助核算项目 */
export function importAuxiliaryItem(
  accountSetId: number,
  auxiliaryTypeId: number,
  file: File,
) {
  return requestClient.upload<FmsAuxiliaryItemApi.ImportResp>(
    '/fms/config/auxiliary-item/import',
    { accountSetId, auxiliaryTypeId, file },
  );
}
