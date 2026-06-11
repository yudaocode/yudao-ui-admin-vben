import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesTmToolApi {
  /** MES 工具台账 */
  export interface Tool {
    id?: number; // 工具编号
    code?: string; // 工具编码
    name?: string; // 工具名称
    brand?: string; // 品牌
    specification?: string; // 型号规格
    toolTypeId?: number; // 工具类型编号
    toolTypeName?: string; // 工具类型名称
    quantity?: number; // 数量
    availableQuantity?: number; // 可用数量
    maintenType?: number; // 保养维护类型
    nextMaintenPeriod?: number; // 下次保养周期
    nextMaintenDate?: Date | number; // 下次保养日期
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询工具台账分页 */
export function getToolPage(params: PageParam) {
  return requestClient.get<PageResult<MesTmToolApi.Tool>>('/mes/tm/tool/page', {
    params,
  });
}

/** 查询工具精简列表 */
export function getToolSimpleList() {
  return requestClient.get<MesTmToolApi.Tool[]>('/mes/tm/tool/simple-list');
}

/** 查询工具台账详情 */
export function getTool(id: number) {
  return requestClient.get<MesTmToolApi.Tool>(`/mes/tm/tool/get?id=${id}`);
}

/** 新增工具台账 */
export function createTool(data: MesTmToolApi.Tool) {
  return requestClient.post('/mes/tm/tool/create', data);
}

/** 修改工具台账 */
export function updateTool(data: MesTmToolApi.Tool) {
  return requestClient.put('/mes/tm/tool/update', data);
}

/** 删除工具台账 */
export function deleteTool(id: number) {
  return requestClient.delete(`/mes/tm/tool/delete?id=${id}`);
}

/** 导出工具台账 */
export function exportTool(params: any) {
  return requestClient.download('/mes/tm/tool/export-excel', { params });
}
