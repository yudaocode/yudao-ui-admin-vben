import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesMdWorkstationApi {
  /** MES 工作站 */
  export interface Workstation {
    id?: number; // 工作站编号
    code?: string; // 工作站编码
    name?: string; // 工作站名称
    address?: string; // 工作站地点
    workshopId?: number; // 所在车间编号
    workshopName?: string; // 所在车间名称
    processId?: number; // 工序编号
    processName?: string; // 工序名称
    warehouseId?: number; // 线边库编号
    locationId?: number; // 库区编号
    areaId?: number; // 库位编号
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询工作站分页 */
export function getWorkstationPage(params: PageParam) {
  return requestClient.get<PageResult<MesMdWorkstationApi.Workstation>>(
    '/mes/md-workstation/page',
    { params },
  );
}

/** 查询工作站详情 */
export function getWorkstation(id: number) {
  return requestClient.get<MesMdWorkstationApi.Workstation>(
    `/mes/md-workstation/get?id=${id}`,
  );
}

/** 新增工作站 */
export function createWorkstation(data: MesMdWorkstationApi.Workstation) {
  return requestClient.post<number>('/mes/md-workstation/create', data);
}

/** 修改工作站 */
export function updateWorkstation(data: MesMdWorkstationApi.Workstation) {
  return requestClient.put('/mes/md-workstation/update', data);
}

/** 删除工作站 */
export function deleteWorkstation(id: number) {
  return requestClient.delete(`/mes/md-workstation/delete?id=${id}`);
}

/** 导出工作站 */
export function exportWorkstation(params: any) {
  return requestClient.download('/mes/md-workstation/export-excel', { params });
}
