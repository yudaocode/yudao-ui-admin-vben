import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ZoneApi {
  /** 区域信息 */
  export interface Zone {
    id: number; // 区域编号
    name?: string; // 区域名称
    abbreviation?: string; // 区域简称
    areaId?: number; // 所属地区
    address?: string; // 详细地址
    coverImage?: string; // 封面图片
    carouselImages?: string; // 轮播图片
    sort?: number; // 显示顺序
  }
}

/** 查询区域分页 */
export function getZonePage(params: PageParam) {
  return requestClient.get<PageResult<ZoneApi.Zone>>('/bdm/zone/page', {
    params,
  });
}

/** 查询区域详情 */
export function getZone(id: number) {
  return requestClient.get<ZoneApi.Zone>(`/bdm/zone/get?id=${id}`);
}

/** 新增区域 */
export function createZone(data: ZoneApi.Zone) {
  return requestClient.post('/bdm/zone/create', data);
}

/** 修改区域 */
export function updateZone(data: ZoneApi.Zone) {
  return requestClient.put('/bdm/zone/update', data);
}

/** 删除区域 */
export function deleteZone(id: number) {
  return requestClient.delete(`/bdm/zone/delete?id=${id}`);
}

/** 批量删除区域 */
export function deleteZoneList(ids: number[]) {
  return requestClient.delete(`/bdm/zone/delete-list?ids=${ids.join(',')}`);
}

/** 导出区域 */
export function exportZone(params: any) {
  return requestClient.download('/bdm/zone/export-excel', params);
}
