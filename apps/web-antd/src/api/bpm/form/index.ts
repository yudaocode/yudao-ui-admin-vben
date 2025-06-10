import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace BpmFormApi {
  /** 流程表单 */
  // TODO @jason：不用 VO 后缀哈
  export interface FormVO {
    id?: number | undefined;
    name: string;
    conf: string;
    fields: string[];
    status: number;
    remark: string;
    createTime: number;
  }
}

/** 获取表单分页列表 */
export async function getFormPage(params: PageParam) {
  return requestClient.get<PageResult<BpmFormApi.FormVO>>('/bpm/form/page', {
    params,
  });
}

/** 获取表单详情 */
// TODO @ziye：应该不会 string 的情况呢。
export async function getFormDetail(id: number | string) {
  return requestClient.get<BpmFormApi.FormVO>(`/bpm/form/get?id=${id}`);
}

/** 创建表单 */
export async function createForm(data: BpmFormApi.FormVO) {
  return requestClient.post('/bpm/form/create', data);
}

/** 更新表单 */
export async function updateForm(data: BpmFormApi.FormVO) {
  return requestClient.put('/bpm/form/update', data);
}

/** 删除表单 */
export async function deleteForm(id: number) {
  return requestClient.delete(`/bpm/form/delete?id=${id}`);
}

/** 获取表单简单列表 */
export async function getFormSimpleList() {
  return requestClient.get<BpmFormApi.FormVO[]>('/bpm/form/simple-list');
}
