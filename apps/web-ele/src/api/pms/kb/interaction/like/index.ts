import { requestClient } from '#/api/request';

/** 点赞文档 */
export function createKnowledgeDocumentLike(documentId: number) {
  return requestClient.post<boolean>('/pms/kb/document-like/create', null, {
    params: { documentId },
  });
}

/** 取消点赞文档 */
export function deleteKnowledgeDocumentLike(documentId: number) {
  return requestClient.delete<boolean>('/pms/kb/document-like/delete', {
    params: { documentId },
  });
}
