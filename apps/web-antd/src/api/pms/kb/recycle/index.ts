import { requestClient } from '#/api/request';

export namespace PmsKnowledgeRecycleApi {
  /** PMS 知识库回收站记录 */
  export interface KnowledgeRecycle {
    id: number; // 回收站记录编号
    libraryId: number; // 知识库编号
    type: number; // 对象类型
    entityId: number; // 对象编号
    name: string; // 对象名称
    fileSize?: number; // 文件大小，单位：字节
    deleteUserId: number; // 删除人用户编号
    deleteUserName?: string; // 删除人姓名
    deleteTime: number; // 删除时间
    parentId?: number; // 父对象编号（详情）
    folderId?: number; // 所属文件夹编号（详情）
  }

  /** PMS 知识库回收站详情子项 */
  export interface KnowledgeRecycleDetailItem {
    id: number;
    type: number;
    name: string;
    parentId?: number;
    folderId?: number;
    deleteTime?: number;
  }

  /** PMS 知识库回收站详情 */
  export interface KnowledgeRecycleDetail {
    root: KnowledgeRecycle;
    children: KnowledgeRecycleDetailItem[];
  }

  /** PMS 知识库回收站预览 */
  export interface KnowledgeRecyclePreview {
    id: number;
    type: number;
    name: string;
    content?: string;
    fileType?: string;
    fileSize?: number;
  }
}

/** 查询知识库回收站列表 */
export function getKnowledgeLibraryRecycleList() {
  return requestClient.get<PmsKnowledgeRecycleApi.KnowledgeRecycle[]>(
    '/pms/kb/recycle/library-list',
  );
}

/** 查询知识库内容回收站列表 */
export function getKnowledgeContentRecycleList(libraryId: number) {
  return requestClient.get<PmsKnowledgeRecycleApi.KnowledgeRecycle[]>(
    '/pms/kb/recycle/content-list',
    { params: { libraryId } },
  );
}

/** 查询知识库回收站对象详情及级联内容 */
export function getKnowledgeContentRecycleDetail(id: number) {
  return requestClient.get<PmsKnowledgeRecycleApi.KnowledgeRecycleDetail>(
    '/pms/kb/recycle/content-detail',
    { params: { id } },
  );
}

/** 预览知识库回收站内容 */
export function getKnowledgeContentRecyclePreview(id: number, entityId?: number) {
  return requestClient.get<PmsKnowledgeRecycleApi.KnowledgeRecyclePreview>(
    '/pms/kb/recycle/content-preview',
    { params: { id, entityId } },
  );
}

/** 恢复回收站记录 */
export function restoreKnowledgeRecycle(id: number) {
  return requestClient.put<boolean>('/pms/kb/recycle/restore', null, {
    params: { id },
  });
}

/** 彻底删除回收站记录 */
export function permanentDeleteKnowledgeRecycle(id: number) {
  return requestClient.delete<boolean>('/pms/kb/recycle/permanent-delete', {
    params: { id },
  });
}
