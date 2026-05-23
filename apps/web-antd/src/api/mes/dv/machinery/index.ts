import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesDvMachineryApi {
  /** MES 设备台账 */
  export interface Machinery {
    id?: number; // 设备编号
    code?: string; // 设备编码
    name?: string; // 设备名称
    brand?: string; // 品牌
    specification?: string; // 规格型号
    machineryTypeId?: number; // 设备类型编号
    machineryTypeName?: string; // 设备类型名称
    workshopId?: number; // 所属车间编号
    workshopName?: string; // 所属车间名称
    status?: number; // 设备状态
    lastMaintenTime?: Date; // 最近保养时间
    lastCheckTime?: Date; // 最近点检时间
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }

  /** 设备导入结果 */
  export interface MachineryImportRespVO {
    createCodes?: string[]; // 新增成功的设备编码
    updateCodes?: string[]; // 更新成功的设备编码
    failureCodes?: Record<string, string>; // 导入失败的设备编码及原因
  }
}

/** 查询设备分页 */
export function getMachineryPage(params: PageParam) {
  return requestClient.get<PageResult<MesDvMachineryApi.Machinery>>(
    '/mes/dv/machinery/page',
    { params },
  );
}

/** 查询设备精简列表 */
export function getMachinerySimpleList() {
  return requestClient.get<MesDvMachineryApi.Machinery[]>(
    '/mes/dv/machinery/simple-list',
  );
}

/** 查询设备详情 */
export function getMachinery(id: number) {
  return requestClient.get<MesDvMachineryApi.Machinery>(
    `/mes/dv/machinery/get?id=${id}`,
  );
}

/** 新增设备 */
export function createMachinery(data: MesDvMachineryApi.Machinery) {
  return requestClient.post('/mes/dv/machinery/create', data);
}

/** 修改设备 */
export function updateMachinery(data: MesDvMachineryApi.Machinery) {
  return requestClient.put('/mes/dv/machinery/update', data);
}

/** 删除设备 */
export function deleteMachinery(id: number) {
  return requestClient.delete(`/mes/dv/machinery/delete?id=${id}`);
}

/** 导出设备 */
export function exportMachinery(params: any) {
  return requestClient.download('/mes/dv/machinery/export-excel', { params });
}

/** 下载设备导入模板 */
export function importMachineryTemplate() {
  return requestClient.download('/mes/dv/machinery/get-import-template');
}

/** 导入设备 */
export function importMachinery(file: File, updateSupport: boolean) {
  return requestClient.upload<MesDvMachineryApi.MachineryImportRespVO>(
    `/mes/dv/machinery/import?updateSupport=${updateSupport}`,
    { file },
  );
}
