import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaFileNodeApi {
  /** OA 云盘文件节点 */
  export interface FileNode {
    id?: number; // 节点编号
    parentId: number; // 父目录编号
    type: number; // 类型：0 目录、1 文件
    name: string; // 名称
    url?: string; // 上传文件地址；详情返回授权后的临时地址，列表不返回
    extension?: string; // 扩展名
    category?: number; // 分类
    size?: number; // 文件大小
    status?: number; // 回收状态
    creator?: string; // 创建人
    createTime?: string; // 创建时间
    updateTime?: string; // 更新时间
    level?: number; // 当前权限
    favorite?: boolean; // 是否收藏
  }

  /** OA 云盘概览 */
  export interface FileStorage {
    usedSize: number; // 已用容量（字节）
    totalSize: number; // 总容量（字节）
    fileCount: number; // 我的文件数量
    sharedCount: number; // 我共享的节点数量
    receivedCount: number; // 共享给我的入口数量
  }
}

/** 查询本人云盘概览 */
export function getFileStorage() {
  return requestClient.get<OaFileNodeApi.FileStorage>(
    '/oa/file-node/get-storage',
  );
}

/** 查询文件分页 */
export function getFileNodePage(params: PageParam) {
  return requestClient.get<PageResult<OaFileNodeApi.FileNode>>(
    '/oa/file-node/page',
    { params },
  );
}

/** 查询本人可用目录 */
export function getFileDirectoryList() {
  return requestClient.get<OaFileNodeApi.FileNode[]>(
    '/oa/file-node/directory-list',
  );
}

/** 查询文件详情 */
export function getFileNode(id: number) {
  return requestClient.get<OaFileNodeApi.FileNode>('/oa/file-node/get', {
    params: { id },
  });
}

/** 新增文件或目录 */
export function createFileNode(data: Partial<OaFileNodeApi.FileNode>) {
  return requestClient.post<number>('/oa/file-node/create', data);
}

/** 重命名节点 */
export function updateFileNodeName(id: number, name: string) {
  return requestClient.put<boolean>('/oa/file-node/update-name', { id, name });
}

/** 复制文件或整目录 */
export function copyFileNode(id: number, parentId: number) {
  return requestClient.post<number>('/oa/file-node/copy', { id, parentId });
}

/** 移动节点 */
export function updateFileNodeParent(id: number, parentId: number) {
  return requestClient.put<boolean>('/oa/file-node/update-parent', {
    id,
    parentId,
  });
}

/** 移入回收站 */
export function recycleFileNode(id: number) {
  return requestClient.put<boolean>('/oa/file-node/recycle', null, {
    params: { id },
  });
}

/** 恢复节点 */
export function restoreFileNode(id: number) {
  return requestClient.put<boolean>('/oa/file-node/restore', null, {
    params: { id },
  });
}

/** 彻底删除业务节点 */
export function deleteFileNode(id: number) {
  return requestClient.delete<boolean>('/oa/file-node/delete', {
    params: { id },
  });
}
