import { requestClient } from '#/api/request';

export namespace PmsProjectAnnouncementApi {
  /** PMS 项目公告 */
  export interface ProjectAnnouncement {
    id?: number; // 公告编号
    projectId: number; // 项目编号
    content: string; // 公告内容
    fileUrls: string[]; // 附件地址列表
    creatorUserId?: number; // 创建者用户编号
    creatorUserName?: string; // 创建者用户昵称
    createTime?: number; // 创建时间
    updateTime?: number; // 更新时间
  }
}

/** 查询项目公告列表 */
export function getProjectAnnouncementList(projectId: number) {
  return requestClient.get<PmsProjectAnnouncementApi.ProjectAnnouncement[]>(
    '/pms/pm/project-announcement/list',
    { params: { projectId } },
  );
}

/** 查询项目公告详情 */
export function getProjectAnnouncement(id: number) {
  return requestClient.get<PmsProjectAnnouncementApi.ProjectAnnouncement>(
    '/pms/pm/project-announcement/get',
    { params: { id } },
  );
}

/** 新增项目公告 */
export function createProjectAnnouncement(
  data: PmsProjectAnnouncementApi.ProjectAnnouncement,
) {
  return requestClient.post<number>('/pms/pm/project-announcement/create', data);
}

/** 修改项目公告 */
export function updateProjectAnnouncement(
  data: PmsProjectAnnouncementApi.ProjectAnnouncement,
) {
  return requestClient.put<boolean>('/pms/pm/project-announcement/update', data);
}

/** 删除项目公告 */
export function deleteProjectAnnouncement(id: number) {
  return requestClient.delete<boolean>('/pms/pm/project-announcement/delete', {
    params: { id },
  });
}
