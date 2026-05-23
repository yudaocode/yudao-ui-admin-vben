import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesMdWorkshopApi {
  /** MES 车间 */
  export interface Workshop {
    id?: number; // 车间编号
    code?: string; // 车间编码
    name?: string; // 车间名称
    area?: number; // 面积
    chargeUserId?: number; // 负责人用户编号
    chargeUserName?: string; // 负责人名称
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询车间分页 */
export function getWorkshopPage(params: PageParam) {
  return requestClient.get<PageResult<MesMdWorkshopApi.Workshop>>(
    '/mes/md-workshop/page',
    { params },
  );
}

/** 查询车间精简列表 */
export function getWorkshopSimpleList() {
  return requestClient.get<MesMdWorkshopApi.Workshop[]>(
    '/mes/md-workshop/simple-list',
  );
}

/** 查询车间详情 */
export function getWorkshop(id: number) {
  return requestClient.get<MesMdWorkshopApi.Workshop>(
    `/mes/md-workshop/get?id=${id}`,
  );
}

/** 新增车间 */
export function createWorkshop(data: MesMdWorkshopApi.Workshop) {
  return requestClient.post('/mes/md-workshop/create', data);
}

/** 修改车间 */
export function updateWorkshop(data: MesMdWorkshopApi.Workshop) {
  return requestClient.put('/mes/md-workshop/update', data);
}

/** 删除车间 */
export function deleteWorkshop(id: number) {
  return requestClient.delete(`/mes/md-workshop/delete?id=${id}`);
}

/** 导出车间 */
export function exportWorkshop(params: any) {
  return requestClient.download('/mes/md-workshop/export-excel', { params });
}
