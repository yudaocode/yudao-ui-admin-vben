import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesProAndonConfigApi {
  /** MES 安灯配置 */
  export interface AndonConfig {
    id?: number; // 编号
    reason?: string; // 呼叫原因
    level?: number; // 级别
    handlerRoleId?: number; // 处置角色编号
    handlerRoleName?: string; // 处置角色名称
    handlerUserId?: number; // 处置人编号
    handlerUserNickname?: string; // 处置人昵称
    remark?: string; // 备注
  }
}

/** 查询安灯配置分页 */
export function getAndonConfigPage(params: PageParam) {
  return requestClient.get<PageResult<MesProAndonConfigApi.AndonConfig>>(
    '/mes/pro/andon-config/page',
    { params },
  );
}

/** 查询安灯配置列表 */
export function getAndonConfigList() {
  return requestClient.get<MesProAndonConfigApi.AndonConfig[]>(
    '/mes/pro/andon-config/list',
  );
}

/** 查询安灯配置详情 */
export function getAndonConfig(id: number) {
  return requestClient.get<MesProAndonConfigApi.AndonConfig>(
    `/mes/pro/andon-config/get?id=${id}`,
  );
}

/** 新增安灯配置 */
export function createAndonConfig(data: MesProAndonConfigApi.AndonConfig) {
  return requestClient.post('/mes/pro/andon-config/create', data);
}

/** 修改安灯配置 */
export function updateAndonConfig(data: MesProAndonConfigApi.AndonConfig) {
  return requestClient.put('/mes/pro/andon-config/update', data);
}

/** 删除安灯配置 */
export function deleteAndonConfig(id: number) {
  return requestClient.delete(`/mes/pro/andon-config/delete?id=${id}`);
}
