import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesProRouteApi {
  /** MES 工艺路线 */
  export interface Route {
    id?: number;
    code?: string;
    name?: string;
    description?: string;
    status?: number;
    remark?: string;
    createTime?: Date;
  }
}

/** 查询工艺路线分页 */
export function getRoutePage(params: PageParam) {
  return requestClient.get<PageResult<MesProRouteApi.Route>>(
    '/mes/pro/route/page',
    { params },
  );
}

/** 查询工艺路线精简列表 */
export function getRouteSimpleList() {
  return requestClient.get<MesProRouteApi.Route[]>(
    '/mes/pro/route/simple-list',
  );
}

/** 查询工艺路线详情 */
export function getRoute(id: number) {
  return requestClient.get<MesProRouteApi.Route>(
    `/mes/pro/route/get?id=${id}`,
  );
}

/** 新增工艺路线 */
export function createRoute(data: MesProRouteApi.Route) {
  return requestClient.post<number>('/mes/pro/route/create', data);
}

/** 修改工艺路线 */
export function updateRoute(data: MesProRouteApi.Route) {
  return requestClient.put('/mes/pro/route/update', data);
}

/** 修改工艺路线状态 */
export function updateRouteStatus(id: number, status: number) {
  return requestClient.put(
    `/mes/pro/route/update-status?id=${id}&status=${status}`,
  );
}

/** 删除工艺路线 */
export function deleteRoute(id: number) {
  return requestClient.delete(`/mes/pro/route/delete?id=${id}`);
}

/** 导出工艺路线 Excel */
export function exportRoute(params: any) {
  return requestClient.download('/mes/pro/route/export-excel', { params });
}
