import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PmsKnowledgeDocumentApi {
  /** PMS 知识库文档 */
  export interface KnowledgeDocument {
    id: number; // 文档编号
    libraryId: number; // 知识库编号
    permissionId: number; // 协作权限编号
    currentUserLevel: number; // 当前用户协作等级
    downloadStatus: boolean; // 当前用户是否可下载
    folderId: number; // 文件夹编号
    parentId: number; // 父文档编号
    title: string; // 文档标题
    contentSummary?: string; // 正文摘要
    content: string; // 文档内容或文件地址
    previewUrl?: string; // 文件预览地址
    type: number; // 文档类型
    fileType?: string; // 文件类型
    fileSize?: number; // 文件大小，单位：字节
    status: number; // 文档状态
    labelIds?: number[]; // 标签编号列表
    creatorUserId?: number; // 创建人用户编号
    creatorUserName?: string; // 创建人姓名
    favoriteStatus: boolean; // 当前用户是否已关注
    likeStatus: boolean; // 当前用户是否已点赞
    /** 点赞用户列表 */
    likeUsers: Array<{
      avatar?: string;
      id: number;
      nickname?: string;
    }>;
    createTime: number; // 创建时间
    updateTime: number; // 更新时间
  }

  /** PMS 知识库文档新增 */
  export interface KnowledgeDocumentCreateReq {
    libraryId: number; // 知识库编号
    folderId: number; // 文件夹编号，0 表示不在文件夹中
    parentId: number; // 父文档编号，0 表示根文档
    title: string; // 文档标题
    type: number; // 文档类型，3 富文本，4 文件
    content?: string; // 文档内容或文件地址
    fileType?: string; // 文件类型
    fileSize?: number; // 文件大小，单位：字节
  }

  /** PMS 知识库文档修改 */
  export interface KnowledgeDocumentUpdateReq {
    id: number; // 文档编号
    title?: string; // 文档标题
    content?: string; // 文档内容或文件地址
    labelIds?: number[]; // 标签编号列表，传空数组表示清空标签
    fileType?: string; // 文件类型
    fileSize?: number; // 文件大小，单位：字节
  }

  /** PMS 知识库文档移动 */
  export interface KnowledgeDocumentMoveReq {
    id: number; // 文档编号
    targetLibraryId: number; // 目标知识库编号
    targetFolderId: number; // 目标文件夹编号，0 表示不在文件夹中
    targetParentId: number; // 目标父文档编号，0 表示根文档
  }

  /** PMS 知识库文档树节点 */
  export interface KnowledgeDocumentTreeNode {
    id: number; // 文档编号
    permissionId: number; // 协作权限编号
    currentUserLevel: number; // 当前用户协作等级
    parentId: number; // 父文档编号
    title: string; // 文档标题
    type: number; // 文档类型
    fileType?: string; // 文件类型
    children: KnowledgeDocumentTreeNode[]; // 子文档列表
  }
}

/** 查询知识库文档详情 */
export function getKnowledgeDocument(id: number, view = false) {
  return requestClient.get<PmsKnowledgeDocumentApi.KnowledgeDocument>(
    '/pms/kb/document/get',
    { params: { id, view } },
  );
}

/** 新增知识库文档 */
export function createKnowledgeDocument(
  data: PmsKnowledgeDocumentApi.KnowledgeDocumentCreateReq,
) {
  return requestClient.post<number>('/pms/kb/document/create', data);
}

/** 修改知识库文档 */
export function updateKnowledgeDocument(
  data: PmsKnowledgeDocumentApi.KnowledgeDocumentUpdateReq,
) {
  return requestClient.put<boolean>('/pms/kb/document/update', data);
}

/** 删除知识库文档 */
export function deleteKnowledgeDocument(id: number) {
  return requestClient.delete<boolean>('/pms/kb/document/delete', {
    params: { id },
  });
}

/** 移动知识库文档 */
export function moveKnowledgeDocument(
  data: PmsKnowledgeDocumentApi.KnowledgeDocumentMoveReq,
) {
  return requestClient.put<boolean>('/pms/kb/document/move', data);
}

/** 查询知识库文档搜索分页 */
export function getKnowledgeDocumentSearchPage(params: PageParam) {
  return requestClient.get<
    PageResult<PmsKnowledgeDocumentApi.KnowledgeDocument>
  >('/pms/kb/document/search-page', { params });
}
