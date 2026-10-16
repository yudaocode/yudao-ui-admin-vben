import { requestClient } from '#/api/request';

export namespace PmsProjectMemberApi {
  /** PMS 项目成员 */
  export interface ProjectMember {
    userId: number; // 后台用户编号
    nickname: string; // 用户昵称
    avatar?: string; // 用户头像
    level: number; // 成员权限级别
    creatorStatus: boolean; // 是否项目创建人
  }

  /** PMS 项目成员项 */
  export interface ProjectMemberItemReq {
    userId: number; // 后台用户编号
    level: number; // 成员权限级别
  }
}

/** 查询项目成员列表 */
export function getProjectMemberList(projectId: number) {
  return requestClient.get<PmsProjectMemberApi.ProjectMember[]>(
    '/pms/pm/project-member/list',
    { params: { projectId } },
  );
}

/** 修改项目成员列表 */
export function updateProjectMemberList(
  projectId: number,
  members: PmsProjectMemberApi.ProjectMemberItemReq[],
) {
  return requestClient.put<boolean>('/pms/pm/project-member/update-list', {
    projectId,
    members,
  });
}

/** 删除项目成员 */
export function deleteProjectMember(projectId: number, userId: number) {
  return requestClient.delete<boolean>('/pms/pm/project-member/delete', {
    params: { projectId, userId },
  });
}

/** 退出项目 */
export function exitProject(projectId: number) {
  return requestClient.delete<boolean>('/pms/pm/project-member/exit', {
    params: { projectId },
  });
}
