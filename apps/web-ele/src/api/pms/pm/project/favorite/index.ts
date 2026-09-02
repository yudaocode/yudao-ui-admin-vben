import { requestClient } from '#/api/request';

/** 收藏项目 */
export function createProjectFavorite(projectId: number) {
  return requestClient.post<boolean>('/pms/pm/project-favorite/create', null, {
    params: { projectId },
  });
}

/** 取消收藏项目 */
export function deleteProjectFavorite(projectId: number) {
  return requestClient.delete<boolean>('/pms/pm/project-favorite/delete', {
    params: { projectId },
  });
}
