import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmBarcodeConfigApi {
  /** MES 条码配置 */
  export interface BarcodeConfig {
    id?: number; // 编号
    format?: number; // 条码格式
    bizType?: number; // 业务类型
    contentFormat?: string; // 内容格式模板
    contentExample?: string; // 内容样例
    autoGenerateFlag?: boolean; // 是否自动生成
    defaultTemplate?: string; // 默认打印模板
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询条码配置分页 */
export function getBarcodeConfigPage(params: PageParam) {
  return requestClient.get<PageResult<MesWmBarcodeConfigApi.BarcodeConfig>>(
    '/mes/wm/barcode-config/page',
    { params },
  );
}

/** 查询条码配置详情 */
export function getBarcodeConfig(id: number) {
  return requestClient.get<MesWmBarcodeConfigApi.BarcodeConfig>(
    `/mes/wm/barcode-config/get?id=${id}`,
  );
}

/** 新增条码配置 */
export function createBarcodeConfig(data: MesWmBarcodeConfigApi.BarcodeConfig) {
  return requestClient.post('/mes/wm/barcode-config/create', data);
}

/** 修改条码配置 */
export function updateBarcodeConfig(data: MesWmBarcodeConfigApi.BarcodeConfig) {
  return requestClient.put('/mes/wm/barcode-config/update', data);
}

/** 删除条码配置 */
export function deleteBarcodeConfig(id: number) {
  return requestClient.delete(`/mes/wm/barcode-config/delete?id=${id}`);
}
