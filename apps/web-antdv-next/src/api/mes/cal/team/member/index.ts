import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesCalTeamMemberApi {
  /** MES 班组成员 */
  export interface TeamMember {
    id?: number; // 成员编号
    teamId?: number; // 班组编号
    userId?: number; // 用户编号
    nickname?: string; // 用户昵称
    telephone?: string; // 用户手机号
    remark?: string; // 备注
  }
}

/** 创建班组成员 */
export function createTeamMember(data: MesCalTeamMemberApi.TeamMember) {
  return requestClient.post('/mes/cal/team-member/create', data);
}

/** 删除班组成员 */
export function deleteTeamMember(id: number) {
  return requestClient.delete(`/mes/cal/team-member/delete?id=${id}`);
}

/** 查询班组成员分页 */
export function getTeamMemberPage(params: PageParam) {
  return requestClient.get<PageResult<MesCalTeamMemberApi.TeamMember>>(
    '/mes/cal/team-member/page',
    { params },
  );
}

/** 查询指定班组的成员列表 */
export function getTeamMemberListByTeam(teamId: number) {
  return requestClient.get<MesCalTeamMemberApi.TeamMember[]>(
    '/mes/cal/team-member/list-by-team',
    { params: { teamId } },
  );
}

/** 查询多个班组的成员列表 */
export function getTeamMemberListByTeamIds(teamIds: number[]) {
  return requestClient.get<MesCalTeamMemberApi.TeamMember[]>(
    '/mes/cal/team-member/list-by-team',
    {
      params: { teamIds: teamIds.join(',') },
    },
  );
}
