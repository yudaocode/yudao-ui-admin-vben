import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesTmToolTypeApi {
  /** MES 工具类型 */
  export interface ToolType {
    id?: number; // 工具类型编号
    code?: string; // 类型编码
    name?: string; // 类型名称
    codeFlag?: boolean; // 是否编码管理
    maintenType?: number; // 保养维护类型
    maintenPeriod?: number; // 保养周期
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询工具类型分页 */
export function getToolTypePage(params: PageParam) {
  return requestClient.get<PageResult<MesTmToolTypeApi.ToolType>>(
    '/mes/tm/tool-type/page',
    { params },
  );
}

/** 查询工具类型精简列表 */
export function getToolTypeSimpleList() {
  return requestClient.get<MesTmToolTypeApi.ToolType[]>(
    '/mes/tm/tool-type/simple-list',
  );
}

/** 查询工具类型详情 */
export function getToolType(id: number) {
  return requestClient.get<MesTmToolTypeApi.ToolType>(
    `/mes/tm/tool-type/get?id=${id}`,
  );
}
