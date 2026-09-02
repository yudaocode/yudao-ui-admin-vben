import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace PmsKnowledgeLibraryTemplateApi {
  /** PMS 知识库模板文档 */
  export interface KnowledgeLibraryTemplateDocument {
    title: string; // 文档标题
    content: string; // 文档内容
  }

  /** PMS 知识库模板 */
  export interface KnowledgeLibraryTemplate {
    id?: number; // 模板编号
    name: string; // 模板名称
    description?: string; // 模板简介
    coverUrl?: string; // 模板封面地址
    status: number; // 模板状态
    sort: number; // 显示顺序
    documents?: KnowledgeLibraryTemplateDocument[]; // 模板文档列表
    createTime?: number; // 创建时间
  }

  /** PMS 知识库模板保存 */
  export interface KnowledgeLibraryTemplateSaveReq
    extends Omit<KnowledgeLibraryTemplate, 'documents'> {
    documents: KnowledgeLibraryTemplateDocument[]; // 模板文档列表
  }
}

/** 查询知识库模板分页 */
export function getKnowledgeLibraryTemplatePage(params: PageParam) {
  return requestClient.get<
    PageResult<PmsKnowledgeLibraryTemplateApi.KnowledgeLibraryTemplate>
  >('/pms/kb/library-template/page', { params });
}

/** 查询知识库模板详情 */
export function getKnowledgeLibraryTemplate(id: number) {
  return requestClient.get<PmsKnowledgeLibraryTemplateApi.KnowledgeLibraryTemplateSaveReq>(
    '/pms/kb/library-template/get',
    { params: { id } },
  );
}

/** 新增知识库模板 */
export function createKnowledgeLibraryTemplate(
  data: PmsKnowledgeLibraryTemplateApi.KnowledgeLibraryTemplateSaveReq,
) {
  return requestClient.post<number>('/pms/kb/library-template/create', data);
}

/** 修改知识库模板 */
export function updateKnowledgeLibraryTemplate(
  data: PmsKnowledgeLibraryTemplateApi.KnowledgeLibraryTemplateSaveReq,
) {
  return requestClient.put<boolean>('/pms/kb/library-template/update', data);
}

/** 删除知识库模板 */
export function deleteKnowledgeLibraryTemplate(id: number) {
  return requestClient.delete<boolean>('/pms/kb/library-template/delete', {
    params: { id },
  });
}
