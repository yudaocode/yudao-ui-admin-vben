import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace AlarmHandlingMethodApi {
  /** 处理方式信息 */
  export interface HandlingMethod {
    id: number; // 编号
    areaId: number; // 地区编号
    zoneId: number; // 区域编号
    buildingId: number; // 楼栋编号
    floorId: number; // 楼层编号
    apartmentId: number; // 房屋编号
    bedId: number; // 床位编号
    type?: string; // 报警类型
    level?: number; // 报警级别
    emergencyAssistance?: number; // 紧急救助
    emergencyNotify?: number; // 紧急通知
    notifyMethod?: string; // 通知方式
  }
}

/** 查询处理方式分页 */
export function getHandlingMethodPage(params: PageParam) {
  return requestClient.get<PageResult<AlarmHandlingMethodApi.HandlingMethod>>(
    '/alarm/handling-method/page',
    { params },
  );
}

/** 查询处理方式详情 */
export function getHandlingMethod(id: number) {
  return requestClient.get<AlarmHandlingMethodApi.HandlingMethod>(
    `/alarm/handling-method/get?id=${id}`,
  );
}

/** 新增处理方式 */
export function createHandlingMethod(
  data: AlarmHandlingMethodApi.HandlingMethod,
) {
  return requestClient.post('/alarm/handling-method/create', data);
}

/** 修改处理方式 */
export function updateHandlingMethod(
  data: AlarmHandlingMethodApi.HandlingMethod,
) {
  return requestClient.put('/alarm/handling-method/update', data);
}

/** 删除处理方式 */
export function deleteHandlingMethod(id: number) {
  return requestClient.delete(`/alarm/handling-method/delete?id=${id}`);
}

/** 批量删除处理方式 */
export function deleteHandlingMethodList(ids: number[]) {
  return requestClient.delete(
    `/alarm/handling-method/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出处理方式 */
export function exportHandlingMethod(params: any) {
  return requestClient.download('/alarm/handling-method/export-excel', {
    params,
  });
}
