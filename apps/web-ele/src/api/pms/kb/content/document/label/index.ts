import type { PageParam, PageResult } from '@vben/request';

import type { PmsKnowledgeDocumentApi } from '..';

import { requestClient } from '#/api/request';

export namespace PmsKnowledgeDocumentLabelApi {
  /** PMS 知识库文档标签 */
  export interface KnowledgeDocumentLabel {
    id: number; // 文档标签编号
    name: string; // 标签名称
    color: string; // 标签颜色
    createTime?: number; // 创建时间
  }
}

/** 查询文档标签详情 */
export function getKnowledgeDocumentLabel(id: number) {
  return requestClient.get<PmsKnowledgeDocumentLabelApi.KnowledgeDocumentLabel>(
    '/pms/kb/document-label/get',
    { params: { id } },
  );
}

/** 查询文档标签列表 */
export function getKnowledgeDocumentLabelList() {
  return requestClient.get<PmsKnowledgeDocumentLabelApi.KnowledgeDocumentLabel[]>(
    '/pms/kb/document-label/list',
  );
}

/** 新增文档标签 */
export function createKnowledgeDocumentLabel(
  data: PmsKnowledgeDocumentLabelApi.KnowledgeDocumentLabel,
) {
  return requestClient.post<number>('/pms/kb/document-label/create', data);
}

/** 修改文档标签 */
export function updateKnowledgeDocumentLabel(
  data: PmsKnowledgeDocumentLabelApi.KnowledgeDocumentLabel,
) {
  return requestClient.put<boolean>('/pms/kb/document-label/update', data);
}

/** 删除文档标签 */
export function deleteKnowledgeDocumentLabel(id: number) {
  return requestClient.delete<boolean>('/pms/kb/document-label/delete', {
    params: { id },
  });
}

/** 查询标签下的文档分页 */
export function getKnowledgeDocumentPageByLabel(params: PageParam) {
  return requestClient.get<PageResult<PmsKnowledgeDocumentApi.KnowledgeDocument>>(
    '/pms/kb/document-label/document-page',
    { params },
  );
}
