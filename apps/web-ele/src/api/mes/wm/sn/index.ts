import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmSnApi {
  /** MES SN 码分组 */
  export interface SnGroup {
    uuid?: string; // 批次 UUID
    count?: number; // SN 码数量
    itemId?: number; // 物料编号
    itemCode?: string; // 物料编码
    itemName?: string; // 物料名称
    specification?: string; // 规格型号
    unitName?: string; // 单位名称
    batchCode?: string; // 批次号
    workOrderId?: number; // 生产工单编号
    createTime?: Date; // 生成时间
  }

  /** MES SN 码生成参数 */
  export interface SnGenerate {
    itemId?: number; // 物料编号
    batchCode?: string; // 批次号
    workOrderId?: number; // 生产工单编号
    count?: number; // 生成数量
  }

  /** MES SN 码分组分页查询参数 */
  export interface PageParams extends PageParam {
    uuid?: string; // 分组 UUID
    code?: string; // SN 码
    itemId?: number; // 物料编号
    batchCode?: string; // 批次号
    createTime?: string[]; // 创建时间
  }
}

/** 生成 SN 码 */
export function generateSnCodes(data: MesWmSnApi.SnGenerate) {
  return requestClient.post('/mes/wm/sn/generate', data);
}

/** 查询 SN 码分组分页 */
export function getSnGroupPage(params: MesWmSnApi.PageParams) {
  return requestClient.get<PageResult<MesWmSnApi.SnGroup>>(
    '/mes/wm/sn/group-page',
    { params },
  );
}

/** 批量删除 SN 码（按批次 UUID） */
export function deleteSnBatch(uuid: string) {
  return requestClient.delete('/mes/wm/sn/delete-batch', {
    params: { uuid },
  });
}

/** 导出 SN 码分组 Excel */
export function exportSnGroupExcel(params: MesWmSnApi.PageParams) {
  return requestClient.download('/mes/wm/sn/group-export-excel', { params });
}

/** 导出批次 SN 码明细 Excel */
export function exportSnDetailExcel(uuid: string) {
  return requestClient.download('/mes/wm/sn/export-excel', {
    params: { uuid },
  });
}
