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
