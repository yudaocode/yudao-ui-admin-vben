import type { PmsKnowledgeDocumentApi } from '../document';

import { requestClient } from '#/api/request';

export namespace PmsKnowledgeFolderApi {
  /** PMS 知识库文件夹 */
  export interface KnowledgeFolder {
    id: number; // 文件夹编号
    libraryId: number; // 知识库编号
    permissionId: number; // 协作权限编号
    currentUserLevel: number; // 当前用户协作等级
    parentId: number; // 父文件夹编号
    title: string; // 文件夹标题
    childFolderCount: number; // 直属子文件夹数量
    documentCount: number; // 直属文档数量
    status: number; // 状态
    favoriteStatus: boolean; // 当前用户是否已关注
    createTime: number; // 创建时间
    updateTime: number; // 更新时间
  }

  /** PMS 知识库文件夹移动 */
  export interface KnowledgeFolderMoveReq {
    id: number; // 文件夹编号
    targetLibraryId: number; // 目标知识库编号
    targetParentId: number; // 目标父文件夹编号，0 表示根目录
  }

  /** PMS 知识库文件夹树节点 */
  export interface KnowledgeFolderTreeNode {
    id: number; // 文件夹编号
    permissionId: number; // 协作权限编号
    currentUserLevel: number; // 当前用户协作等级
    parentId: number; // 父文件夹编号
    title: string; // 文件夹标题
    children: KnowledgeFolderTreeNode[]; // 子文件夹列表
    documents: PmsKnowledgeDocumentApi.KnowledgeDocumentTreeNode[]; // 文件夹下的文档列表
  }

  /** PMS 知识库目录树 */
  export interface KnowledgeTree {
    libraryId: number; // 知识库编号
    writeStatus: boolean; // 当前用户是否可编辑
    manageStatus: boolean; // 当前用户是否可管理目录结构
    folders: KnowledgeFolderTreeNode[]; // 根文件夹列表
    documents: PmsKnowledgeDocumentApi.KnowledgeDocumentTreeNode[]; // 根文档列表
  }
}

/** 查询知识库目录树 */
export function getKnowledgeTree(libraryId: number) {
  return requestClient.get<PmsKnowledgeFolderApi.KnowledgeTree>(
    '/pms/kb/folder/tree',
    { params: { libraryId } },
  );
}

/** 查询知识库文件夹详情 */
export function getKnowledgeFolder(id: number, view = false) {
  return requestClient.get<PmsKnowledgeFolderApi.KnowledgeFolder>(
    '/pms/kb/folder/get',
    { params: { id, view } },
  );
}

/** 新增知识库文件夹 */
export function createKnowledgeFolder(
  data: PmsKnowledgeFolderApi.KnowledgeFolder,
) {
  return requestClient.post<number>('/pms/kb/folder/create', data);
}

/** 修改知识库文件夹 */
export function updateKnowledgeFolder(
  data: PmsKnowledgeFolderApi.KnowledgeFolder,
) {
  return requestClient.put<boolean>('/pms/kb/folder/update', data);
}

/** 删除知识库文件夹 */
export function deleteKnowledgeFolder(id: number) {
  return requestClient.delete<boolean>('/pms/kb/folder/delete', {
    params: { id },
  });
}

/** 移动知识库文件夹 */
export function moveKnowledgeFolder(
  data: PmsKnowledgeFolderApi.KnowledgeFolderMoveReq,
) {
  return requestClient.put<boolean>('/pms/kb/folder/move', data);
}
