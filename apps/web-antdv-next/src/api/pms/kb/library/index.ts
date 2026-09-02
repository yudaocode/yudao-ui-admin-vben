import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PmsKnowledgeLibraryApi {
  /** PMS 知识库 */
  export interface KnowledgeLibrary {
    id: number; // 知识库编号
    name: string; // 知识库名称
    description?: string; // 知识库简介
    openStatus: boolean; // 是否公开
    coverUrl?: string; // 知识库封面
    adminUserIds?: number[]; // 创建时的初始管理员用户编号列表
    memberUserIds?: number[]; // 创建时的初始普通成员用户编号列表
    templateId?: number; // 模板编号，仅创建时有效
    creatorUserId?: number; // 创建人用户编号
    creatorUserName?: string; // 创建人姓名
    memberCount?: number; // 成员数量
    documentCount?: number; // 文档数量
    fileCount?: number; // 文件数量
    writeStatus?: boolean; // 当前用户是否可以编辑内容
    adminStatus?: boolean; // 当前用户是否为知识库管理员
    exitStatus?: boolean; // 当前用户是否可以主动退出知识库
    favoriteStatus?: boolean; // 当前用户是否已关注
    createTime?: number; // 创建时间
  }

  /** PMS 知识库模板选择 */
  export interface KnowledgeLibraryTemplate {
    id: number; // 模板编号
    name: string; // 模板名称
    description?: string; // 模板简介
    coverUrl?: string; // 模板封面
    documents?: KnowledgeLibraryTemplateDocument[]; // 模板文档列表（仅标题）
  }

  /** PMS 知识库模板文档 */
  export interface KnowledgeLibraryTemplateDocument {
    title: string; // 文档标题
  }
}

/** 查询知识库分页 */
export function getKnowledgeLibraryPage(params: PageParam) {
  return requestClient.get<PageResult<PmsKnowledgeLibraryApi.KnowledgeLibrary>>(
    '/pms/kb/library/page',
    { params },
  );
}

/** 查询知识库详情 */
export function getKnowledgeLibrary(id: number) {
  return requestClient.get<PmsKnowledgeLibraryApi.KnowledgeLibrary>(
    '/pms/kb/library/get',
    { params: { id } },
  );
}

/** 查询知识库模板列表 */
export function getKnowledgeLibraryTemplateList() {
  return requestClient.get<PmsKnowledgeLibraryApi.KnowledgeLibraryTemplate[]>(
    '/pms/kb/library-template/simple-list',
  );
}

/** 新增知识库 */
export function createKnowledgeLibrary(
  data: PmsKnowledgeLibraryApi.KnowledgeLibrary,
) {
  return requestClient.post<number>('/pms/kb/library/create', data);
}

/** 修改知识库 */
export function updateKnowledgeLibrary(
  data: PmsKnowledgeLibraryApi.KnowledgeLibrary,
) {
  return requestClient.put<boolean>('/pms/kb/library/update', data);
}

/** 删除知识库 */
export function deleteKnowledgeLibrary(id: number) {
  return requestClient.delete<boolean>('/pms/kb/library/delete', {
    params: { id },
  });
}
