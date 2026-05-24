import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesMdUnitMeasureApi {
  /** MES 计量单位 */
  export interface UnitMeasure {
    id?: number; // 单位编号
    code?: string; // 单位编码
    name?: string; // 单位名称
    primaryFlag?: boolean; // 是否主单位
    primaryId?: number; // 主单位编号
    changeRate?: number; // 与主单位换算比例
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询计量单位分页 */
export function getUnitMeasurePage(params: PageParam) {
  return requestClient.get<PageResult<MesMdUnitMeasureApi.UnitMeasure>>(
    '/mes/md/unit-measure/page',
    { params },
  );
}

/** 查询计量单位精简列表 */
export function getUnitMeasureSimpleList() {
  return requestClient.get<MesMdUnitMeasureApi.UnitMeasure[]>(
    '/mes/md/unit-measure/simple-list',
  );
}

/** 查询计量单位详情 */
export function getUnitMeasure(id: number) {
  return requestClient.get<MesMdUnitMeasureApi.UnitMeasure>(
    `/mes/md/unit-measure/get?id=${id}`,
  );
}

/** 新增计量单位 */
export function createUnitMeasure(data: MesMdUnitMeasureApi.UnitMeasure) {
  return requestClient.post('/mes/md/unit-measure/create', data);
}

/** 修改计量单位 */
export function updateUnitMeasure(data: MesMdUnitMeasureApi.UnitMeasure) {
  return requestClient.put('/mes/md/unit-measure/update', data);
}

/** 删除计量单位 */
export function deleteUnitMeasure(id: number) {
  return requestClient.delete(`/mes/md/unit-measure/delete?id=${id}`);
}

/** 导出计量单位 */
export function exportUnitMeasure(params: PageParam) {
  return requestClient.download('/mes/md/unit-measure/export-excel', {
    params,
  });
}
