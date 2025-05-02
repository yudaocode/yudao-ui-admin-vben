import type { PageParam, PageResult } from '@vben/request';

import type { BpmModelApi } from '#/api/bpm/model';

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

  /** 模型分类信息 */
  // TODO @jason：这个应该非 api 的，可以考虑抽到页面里哈。
  export interface ModelCategoryInfo {
    id: number;
    name: string;
    modelList: BpmModelApi.ModelVO[];
  }
}

/** 查询流程分类分页 */
export async function getCategoryPage(params: PageParam) {
  return requestClient.get<PageResult<BpmCategoryApi.CategoryVO>>(
    '/bpm/category/page',
    { params },
  );
}

/** 查询流程分类详情 */
export async function getCategory(id: number) {
  return requestClient.get<BpmCategoryApi.CategoryVO>(
    `/bpm/category/get?id=${id}`,
  );
}

/** 新增流程分类 */
export async function createCategory(data: BpmCategoryApi.CategoryVO) {
  return requestClient.post<number>('/bpm/category/create', data);
}

/** 修改流程分类 */
export async function updateCategory(data: BpmCategoryApi.CategoryVO) {
  return requestClient.put<boolean>('/bpm/category/update', data);
}

/** 删除流程分类 */
export async function deleteCategory(id: number) {
  return requestClient.delete<boolean>(`/bpm/category/delete?id=${id}`);
}

/** 查询流程分类列表 */
export async function getCategorySimpleList() {
  return requestClient.get<BpmCategoryApi.CategoryVO[]>(
    `/bpm/category/simple-list`,
  );
}

/** 批量修改流程分类的排序 */
export async function updateCategorySortBatch(ids: number[]) {
  const params = ids.join(',');
  return requestClient.put<boolean>(
    `/bpm/category/update-sort-batch?ids=${params}`,
  );
}
