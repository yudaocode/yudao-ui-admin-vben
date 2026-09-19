import { requestClient } from '#/api/request';

export namespace OaFilePermissionApi {
  /** OA 云盘共享权限 */
  export interface FilePermission {
    id?: number; // 编号
    nodeId: number; // 文件节点
    subjectType: number; // 主体类型
    subjectId?: number; // 主体编号
    level: number; // 权限级别
    inherit: boolean; // 是否继承
    expireTime?: string; // 到期时间
  }
}

/** 查询共享权限 */
export function getFilePermissionList(nodeId: number) {
  return requestClient.get<OaFilePermissionApi.FilePermission[]>(
    '/oa/file-permission/list',
    { params: { nodeId } },
  );
}

/** 保存共享权限 */
export function saveFilePermission(
  data: Partial<OaFilePermissionApi.FilePermission>,
) {
  return requestClient.post<number>('/oa/file-permission/save', data);
}

/** 取消共享权限 */
export function deleteFilePermission(id: number) {
  return requestClient.delete<boolean>('/oa/file-permission/delete', {
    params: { id },
  });
}
