import { requestClient } from '#/api/request';

export namespace PmsProjectGroupApi {
  /** PMS 项目分组 */
  export interface ProjectGroup {
    id?: number; // 项目分组编号
    name: string; // 分组名称
    sort?: number; // 显示顺序
    type?: number; // 分组类型
    projectCount?: number; // 项目数量
    createTime?: number; // 创建时间
  }

  /** PMS 项目分组排序项 */
  export interface ProjectGroupSortItemReq {
    id: number; // 项目分组编号
    sort: number; // 显示顺序
  }

  /** PMS 项目移动分组 */
  export interface ProjectGroupMoveReq {
    projectId: number; // 项目编号
    groupId?: number; // 目标项目分组编号；不传表示移动到未分组
  }
}

/** 查询当前用户的项目分组列表 */
export function getProjectGroupList() {
  return requestClient.get<PmsProjectGroupApi.ProjectGroup[]>(
    '/pms/pm/project-group/list',
  );
}

/** 新增项目分组 */
export function createProjectGroup(data: PmsProjectGroupApi.ProjectGroup) {
  return requestClient.post<number>('/pms/pm/project-group/create', data);
}

/** 修改项目分组 */
export function updateProjectGroup(data: PmsProjectGroupApi.ProjectGroup) {
  return requestClient.put<boolean>('/pms/pm/project-group/update', data);
}

/** 修改项目分组排序 */
export function updateProjectGroupSort(
  items: PmsProjectGroupApi.ProjectGroupSortItemReq[],
) {
  return requestClient.put<boolean>('/pms/pm/project-group/update-sort', {
    items,
  });
}

/** 删除项目分组 */
export function deleteProjectGroup(id: number) {
  return requestClient.delete<boolean>('/pms/pm/project-group/delete', {
    params: { id },
  });
}

/** 移动项目到个人分组 */
export function moveProjectToGroup(data: PmsProjectGroupApi.ProjectGroupMoveReq) {
  return requestClient.put<boolean>('/pms/pm/project-group/move-project', data);
}
