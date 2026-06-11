import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmBarcodeApi {
  /** MES 条码清单 */
  export interface Barcode {
    id?: number; // 条码编号
    configId?: number; // 条码配置编号
    format?: number; // 条码格式
    bizType?: number; // 业务类型
    content?: string; // 条码内容
    bizId?: number; // 业务对象编号
    bizCode?: string; // 业务对象编码
    bizName?: string; // 业务对象名称
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询条码分页 */
export function getBarcodePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmBarcodeApi.Barcode>>(
    '/mes/wm/barcode/page',
    { params },
  );
}

/** 查询条码详情 */
export function getBarcode(id: number) {
  return requestClient.get<MesWmBarcodeApi.Barcode>(
    `/mes/wm/barcode/get?id=${id}`,
  );
}

/** 根据业务对象获取条码 */
export function getBarcodeByBusiness(bizType: number, bizId: number) {
  return requestClient.get<MesWmBarcodeApi.Barcode>(
    '/mes/wm/barcode/get-by-business',
    { params: { bizId, bizType } },
  );
}

/** 新增条码 */
export function createBarcode(data: MesWmBarcodeApi.Barcode) {
  return requestClient.post('/mes/wm/barcode/create', data);
}

/** 修改条码 */
export function updateBarcode(data: MesWmBarcodeApi.Barcode) {
  return requestClient.put('/mes/wm/barcode/update', data);
}

/** 删除条码 */
export function deleteBarcode(id: number) {
  return requestClient.delete(`/mes/wm/barcode/delete?id=${id}`);
}

/** 导出条码 */
export function exportBarcode(params: any) {
  return requestClient.download('/mes/wm/barcode/export-excel', { params });
}

/** 生成条码内容 */
export function generateBarcodeContent(bizType: number, bizCode: string) {
  return requestClient.get<string>('/mes/wm/barcode/generate-content', {
    params: { bizCode, bizType },
  });
}
