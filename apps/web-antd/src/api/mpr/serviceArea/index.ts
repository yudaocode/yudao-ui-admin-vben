import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ServiceAreaApi {
  /** 服务地区信息 */
  export interface ServiceArea {
    id: number; // 编号
    country: string; // 国家代码
    location: string; // 位置
    city: string; // 城市
    state: string; // 省份/州缩写
    cityId: number; // 城市ID
    coordinate: string; // 坐标
    currency: string; // 货币
    description: string; // 说明
    status: boolean; // 状态
  }
}

/** 查询服务地区分页 */
export function getServiceAreaPage(params: PageParam) {
  return requestClient.get<PageResult<ServiceAreaApi.ServiceArea>>(
    '/mpr/service-area/page',
    { params },
  );
}

/** 查询服务地区详情 */
export function getServiceArea(id: number) {
  return requestClient.get<ServiceAreaApi.ServiceArea>(
    `/mpr/service-area/get?id=${id}`,
  );
}

/** 新增服务地区 */
export function createServiceArea(data: ServiceAreaApi.ServiceArea) {
  return requestClient.post('/mpr/service-area/create', data);
}

/** 修改服务地区 */
export function updateServiceArea(data: ServiceAreaApi.ServiceArea) {
  return requestClient.put('/mpr/service-area/update', data);
}

/** 删除服务地区 */
export function deleteServiceArea(id: number) {
  return requestClient.delete(`/mpr/service-area/delete?id=${id}`);
}

/** 批量删除服务地区 */
export function deleteServiceAreaList(ids: number[]) {
  return requestClient.delete(
    `/mpr/service-area/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出服务地区 */
export function exportServiceArea(params: any) {
  return requestClient.download('/mpr/service-area/export-excel', params);
}

// 获取服务地区下拉列表
export function getServiceAreaSimpleList() {
  return requestClient.get('/mpr/service-area/simple-list');
}
