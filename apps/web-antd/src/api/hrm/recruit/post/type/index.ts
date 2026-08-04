import { requestClient } from '#/api/request';

export namespace HrmRecruitPostTypeApi {
  /** 招聘职位类型 */
  export interface PostType {
    id: number;
    name: string;
    parentId: number;
    sort?: number;
    status?: number;
    createTime?: Date;
  }
}

/** 查询招聘职位类型列表 */
export function getRecruitPostTypeList(params?: { status?: number }) {
  return requestClient.get<HrmRecruitPostTypeApi.PostType[]>(
    '/hrm/recruit/post-type/list',
    { params },
  );
}
