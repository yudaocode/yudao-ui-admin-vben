import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesMdUnitMeasureApi {
  /** MES 计量单位 */
  export interface UnitMeasure {
    id: number;
    code?: string;
    name?: string;
    primaryFlag?: boolean;
    primaryId?: number;
    changeRate?: number;
    status?: number;
    remark?: string;
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
export function exportUnitMeasure(params: any) {
  return requestClient.download('/mes/md/unit-measure/export-excel', { params });
}
