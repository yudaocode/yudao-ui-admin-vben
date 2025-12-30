import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace TagApi {
  /** 标签信息 */
  export interface Tag {
    id: number; // 编号
    name?: string; // 标签名称
    type?: string; // 标签类型
    description: string; // 标签描述
  }
}

/** 查询标签分页 */
export function getTagPage(params: PageParam) {
  return requestClient.get<PageResult<TagApi.Tag>>('/mpr/tag/page', { params });
}
/** 查询标签精简列表 */
export function getSimpleTagList() {
  return requestClient.get<TagApi.Tag[]>('/mpr/tag/simple-list');
}
/** 查询标签详情 */
export function getTag(id: number) {
  return requestClient.get<TagApi.Tag>(`/mpr/tag/get?id=${id}`);
}

/** 新增标签 */
export function createTag(data: TagApi.Tag) {
  return requestClient.post('/mpr/tag/create', data);
}

/** 修改标签 */
export function updateTag(data: TagApi.Tag) {
  return requestClient.put('/mpr/tag/update', data);
}

/** 删除标签 */
export function deleteTag(id: number) {
  return requestClient.delete(`/mpr/tag/delete?id=${id}`);
}

/** 批量删除标签 */
export function deleteTagList(ids: number[]) {
  return requestClient.delete(`/mpr/tag/delete-list?ids=${ids.join(',')}`);
}

/** 导出标签 */
export function exportTag(params: any) {
  return requestClient.download('/mpr/tag/export-excel', params);
}
