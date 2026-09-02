import { requestClient } from '#/api/request';

export namespace PmsKnowledgeGroupApi {
  /** PMS 知识库分组 */
  export interface KnowledgeGroup {
    id?: number; // 知识库分组编号（新增时不传）
    name: string; // 分组名称
    sort: number; // 显示顺序
    type: number; // 分组类型
    libraryCount?: number; // 分组内知识库数量（列表返回）
    createTime?: number; // 创建时间
  }

  /** PMS 知识库分组排序项 */
  export interface KnowledgeGroupSortItemReq {
    id: number; // 知识库分组编号
    sort: number; // 显示顺序
  }
}

/** 查询当前用户的知识库分组列表 */
export function getKnowledgeGroupList() {
  return requestClient.get<PmsKnowledgeGroupApi.KnowledgeGroup[]>(
    '/pms/kb/group/list',
  );
}

/** 查询知识库分组详情 */
export function getKnowledgeGroup(id: number) {
  return requestClient.get<PmsKnowledgeGroupApi.KnowledgeGroup>(
    '/pms/kb/group/get',
    { params: { id } },
  );
}

/** 新增知识库分组 */
export function createKnowledgeGroup(data: PmsKnowledgeGroupApi.KnowledgeGroup) {
  return requestClient.post<number>('/pms/kb/group/create', data);
}

/** 修改知识库分组 */
export function updateKnowledgeGroup(data: PmsKnowledgeGroupApi.KnowledgeGroup) {
  return requestClient.put<boolean>('/pms/kb/group/update', data);
}

/** 修改知识库分组排序 */
export function updateKnowledgeGroupSort(
  items: PmsKnowledgeGroupApi.KnowledgeGroupSortItemReq[],
) {
  return requestClient.put<boolean>('/pms/kb/group/update-sort', { items });
}

/** 删除知识库分组 */
export function deleteKnowledgeGroup(id: number) {
  return requestClient.delete<boolean>('/pms/kb/group/delete', {
    params: { id },
  });
}

/** 移动知识库到个人分组 */
export function moveKnowledgeLibraryToGroup(libraryId: number, groupId?: number) {
  return requestClient.put<boolean>('/pms/kb/group/move', {
    libraryId,
    groupId,
  });
}
