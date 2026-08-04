import { requestClient } from '#/api/request';

export namespace HrmRecruitPostTypeApi {
  /** 招聘职位类型 */
  export interface RecruitPostType {
    id: number; // 职位类型编号
    name: string; // 类型名称
    parentId: number; // 父类型编号
    sort?: number; // 排序
    status?: number; // 状态
    createTime?: Date; // 创建时间
  }
}

/** 查询招聘职位类型列表 */
export function getRecruitPostTypeList(params?: { status?: number }) {
  return requestClient.get<HrmRecruitPostTypeApi.RecruitPostType[]>(
    '/hrm/recruit/post-type/list',
    { params },
  );
}
