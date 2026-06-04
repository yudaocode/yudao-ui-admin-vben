import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesCalTeamApi {
  /** MES 班组 */
  export interface Team {
    id?: number; // 班组编号
    code?: string; // 班组编码
    name?: string; // 班组名称
    calendarType?: number; // 班组类型
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询班组分页 */
export function getTeamPage(params: PageParam) {
  return requestClient.get<PageResult<MesCalTeamApi.Team>>(
    '/mes/cal/team/page',
    { params },
  );
}

/** 查询班组列表 */
export function getTeamList() {
  return requestClient.get<MesCalTeamApi.Team[]>('/mes/cal/team/list');
}

/** 查询班组详情 */
export function getTeam(id: number) {
  return requestClient.get<MesCalTeamApi.Team>(`/mes/cal/team/get?id=${id}`);
}

/** 新增班组 */
export function createTeam(data: MesCalTeamApi.Team) {
  return requestClient.post('/mes/cal/team/create', data);
}

/** 修改班组 */
export function updateTeam(data: MesCalTeamApi.Team) {
  return requestClient.put('/mes/cal/team/update', data);
}

/** 删除班组 */
export function deleteTeam(id: number) {
  return requestClient.delete(`/mes/cal/team/delete?id=${id}`);
}

/** 导出班组 */
export function exportTeam(params: any) {
  return requestClient.download('/mes/cal/team/export-excel', { params });
}
