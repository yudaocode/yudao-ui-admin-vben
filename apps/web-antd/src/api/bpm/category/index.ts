import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace BpmCategoryApi {
  /** BPM 流程分类 VO */
  export interface CategoryVO {
    id: number;
    name: string;
    code: string;
    status: number;
    sort: number; // 分类排序
  }
}

/** 查询流程分类分页 */
export async function getCategoryPage(params: PageParam) {
  return requestClient.get<PageResult<BpmCategoryApi.CategoryVO>>('/bpm/category/page', { params });
}

/** 查询流程分类详情 */
export async function getCategory(id: number) {
  return requestClient.get<BpmCategoryApi.CategoryVO>(`/bpm/category/get?id=${id}`);
}

/** 新增流程分类 */
export async function createCategory(data: BpmCategoryApi.CategoryVO) {
  return requestClient.post('/bpm/category/create', data);
}

/** 修改流程分类 */
export async function updateCategory(data: BpmCategoryApi.CategoryVO) {
  return requestClient.put('/bpm/category/update', data);
}

/** 删除流程分类 */
export async function deleteCategory(id: number) {
  return requestClient.delete(`/bpm/category/delete?id=${id}`);
}
