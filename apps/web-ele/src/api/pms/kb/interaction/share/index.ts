import { requestClient } from '#/api/request';

export namespace PmsKnowledgeDocumentShareApi {
  /** PMS 知识库文档分享 */
  export interface KnowledgeDocumentShare {
    id: number; // 分享编号
    documentId: number; // 文档编号
    shareUserIds: number[]; // 内部分享成员用户编号列表
    token: string; // 外部查看令牌
    status: number; // 分享状态
    createTime: number; // 创建时间
    closeUserId?: number; // 关闭人用户编号
    closeTime?: number; // 关闭时间
  }

  /** PMS 知识库文档公开分享 */
  export interface KnowledgeDocumentSharePublic {
    id: number; // 文档编号
    title: string; // 文档标题
    content?: string; // 富文本文档内容
    previewUrl?: string; // 文件临时预览地址
    type: number; // 文档类型
    fileType?: string; // 文件类型
    updateTime: number; // 更新时间
  }
}

/** 查询文档分享信息 */
export function getKnowledgeDocumentShare(documentId: number) {
  return requestClient.get<
    PmsKnowledgeDocumentShareApi.KnowledgeDocumentShare | undefined
  >('/pms/kb/document-share/get', { params: { documentId } });
}

/** 开启文档分享 */
export function openKnowledgeDocumentShare(data: {
  documentId: number;
  shareUserIds: number[];
}) {
  return requestClient.post<PmsKnowledgeDocumentShareApi.KnowledgeDocumentShare>(
    '/pms/kb/document-share/open',
    data,
  );
}

/** 修改文档分享成员列表 */
export function updateKnowledgeDocumentShareMemberList(data: {
  documentId: number;
  shareUserIds: number[];
}) {
  return requestClient.put<boolean>(
    '/pms/kb/document-share/update-member-list',
    data,
  );
}

/** 关闭文档分享 */
export function closeKnowledgeDocumentShare(documentId: number) {
  return requestClient.put<boolean>('/pms/kb/document-share/close', null, {
    params: { documentId },
  });
}

/** 查询公开分享的文档内容 */
export function getPublicKnowledgeDocument(token: string) {
  return requestClient.get<PmsKnowledgeDocumentShareApi.KnowledgeDocumentSharePublic>(
    '/pms/kb/document-share/get-by-token',
    { params: { token } },
  );
}
