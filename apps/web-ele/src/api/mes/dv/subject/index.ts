import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesDvSubjectApi {
  /** MES 点检保养项目 */
  export interface Subject {
    id?: number; // 项目编号
    code?: string; // 项目编码
    name?: string; // 项目名称
    type?: number; // 项目类型
    content?: string; // 项目内容
    standard?: string; // 标准
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询点检保养项目分页 */
export function getSubjectPage(params: PageParam) {
  return requestClient.get<PageResult<MesDvSubjectApi.Subject>>(
    '/mes/dv/subject/page',
    { params },
  );
}

/** 查询点检保养项目精简列表 */
export function getSubjectSimpleList() {
  return requestClient.get<MesDvSubjectApi.Subject[]>(
    '/mes/dv/subject/simple-list',
  );
}

/** 查询点检保养项目详情 */
export function getSubject(id: number) {
  return requestClient.get<MesDvSubjectApi.Subject>(
    `/mes/dv/subject/get?id=${id}`,
  );
}

/** 新增点检保养项目 */
export function createSubject(data: MesDvSubjectApi.Subject) {
  return requestClient.post('/mes/dv/subject/create', data);
}

/** 修改点检保养项目 */
export function updateSubject(data: MesDvSubjectApi.Subject) {
  return requestClient.put('/mes/dv/subject/update', data);
}

/** 删除点检保养项目 */
export function deleteSubject(id: number) {
  return requestClient.delete(`/mes/dv/subject/delete?id=${id}`);
}

/** 导出点检保养项目 */
export function exportSubject(params: any) {
  return requestClient.download('/mes/dv/subject/export-excel', { params });
}
