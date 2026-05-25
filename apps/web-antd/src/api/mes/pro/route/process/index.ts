import { requestClient } from '#/api/request';

export namespace MesProRouteProcessApi {
  /** MES 工艺路线工序 */
  export interface RouteProcess {
    id?: number;
    routeId?: number;
    processId?: number;
    processCode?: string;
    processName?: string;
    sort?: number;
    nextProcessId?: number;
    nextProcessName?: string;
    linkType?: number;
    prepareTime?: number;
    waitTime?: number;
    colorCode?: string;
    keyFlag?: boolean;
    checkFlag?: boolean;
    remark?: string;
    createTime?: Date;
  }
}

/** 按工艺路线查询工序列表 */
export function getRouteProcessListByRoute(routeId: number) {
  return requestClient.get<MesProRouteProcessApi.RouteProcess[]>(
    `/mes/pro/route-process/list-by-route?routeId=${routeId}`,
  );
}

/** 按产品查询工序列表（自动查找关联的工艺路线） */
export function getRouteProcessListByProduct(productId: number) {
  return requestClient.get<MesProRouteProcessApi.RouteProcess[]>(
    `/mes/pro/route-process/list-by-product?productId=${productId}`,
  );
}

/** 查询工艺路线工序详情 */
export function getRouteProcess(id: number) {
  return requestClient.get<MesProRouteProcessApi.RouteProcess>(
    `/mes/pro/route-process/get?id=${id}`,
  );
}

/** 按工艺路线 + 工序精确查询工序配置 */
export function getRouteProcessByRouteAndProcess(
  routeId: number,
  processId: number,
) {
  return requestClient.get<MesProRouteProcessApi.RouteProcess>(
    '/mes/pro/route-process/get-by-route-and-process',
    { params: { processId, routeId } },
  );
}

/** 新增工艺路线工序 */
export function createRouteProcess(data: MesProRouteProcessApi.RouteProcess) {
  return requestClient.post('/mes/pro/route-process/create', data);
}

/** 修改工艺路线工序 */
export function updateRouteProcess(data: MesProRouteProcessApi.RouteProcess) {
  return requestClient.put('/mes/pro/route-process/update', data);
}

/** 删除工艺路线工序 */
export function deleteRouteProcess(id: number) {
  return requestClient.delete(`/mes/pro/route-process/delete?id=${id}`);
}
