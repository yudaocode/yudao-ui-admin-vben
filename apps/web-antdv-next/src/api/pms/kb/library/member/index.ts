import { requestClient } from '#/api/request';

export namespace PmsKnowledgeLibraryMemberApi {
  /** PMS 知识库成员 */
  export interface KnowledgeLibraryMember {
    id: number; // 成员编号
    userId?: number; // 用户编号
    nickname?: string; // 用户姓名
    avatar?: string; // 用户头像
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    parentDeptId?: number; // 父部门编号
    parentDeptName?: string; // 父部门名称
    level: number; // 成员等级
  }

  /** PMS 知识库成员列表修改 */
  export interface KnowledgeLibraryMemberUpdateReq {
    libraryId: number; // 知识库编号
    members: Array<{ deptId?: number; level: number; userId?: number }>; // 成员列表
  }
}

/** 查询知识库成员列表 */
export function getKnowledgeLibraryMemberList(libraryId: number) {
  return requestClient.get<PmsKnowledgeLibraryMemberApi.KnowledgeLibraryMember[]>(
    '/pms/kb/library-member/list',
    { params: { libraryId } },
  );
}

/** 修改知识库成员列表 */
export function updateKnowledgeLibraryMemberList(
  data: PmsKnowledgeLibraryMemberApi.KnowledgeLibraryMemberUpdateReq,
) {
  return requestClient.put<boolean>('/pms/kb/library-member/update-list', data);
}

/** 退出知识库 */
export function exitKnowledgeLibrary(libraryId: number) {
  return requestClient.delete<boolean>('/pms/kb/library-member/exit', {
    params: { libraryId },
  });
}
