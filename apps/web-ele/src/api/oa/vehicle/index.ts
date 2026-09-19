import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaVehicleApi {
  /** OA 车辆 */
  export interface Vehicle {
    id?: number; // 编号
    no?: string; // 车牌号
    name?: string; // 车辆名称
    deptId?: number; // 所属部门编号
    deptName?: string; // 所属部门名称
    type?: string; // 车型
    category?: string; // 车辆分类
    brandModel?: string; // 品牌型号
    seatCount?: number; // 座位数
    barePrice?: number; // 裸车价格（元）
    compulsoryInsuranceExpireTime?: string; // 交强险到期时间
    commercialInsuranceExpireTime?: string; // 商业险到期时间
    inspectionExpireTime?: string; // 年检到期时间
    picUrl?: string; // 车辆照片 URL
    status?: number; // 车辆信息管理状态
    sort?: number; // 显示顺序
    remark?: string; // 备注
    createTime?: string; // 创建时间
  }
}

/** 查询车辆分页 */
export function getVehiclePage(params: PageParam) {
  return requestClient.get<PageResult<OaVehicleApi.Vehicle>>(
    '/oa/vehicle/page',
    { params },
  );
}

/** 查询车辆详情 */
export function getVehicle(id: number) {
  return requestClient.get<OaVehicleApi.Vehicle>('/oa/vehicle/get', {
    params: { id },
  });
}

/** 新增车辆 */
export function createVehicle(data: Partial<OaVehicleApi.Vehicle>) {
  return requestClient.post<number>('/oa/vehicle/create', data);
}

/** 修改车辆 */
export function updateVehicle(data: Partial<OaVehicleApi.Vehicle>) {
  return requestClient.put<boolean>('/oa/vehicle/update', data);
}

/** 删除车辆 */
export function deleteVehicle(id: number) {
  return requestClient.delete<boolean>('/oa/vehicle/delete', {
    params: { id },
  });
}
