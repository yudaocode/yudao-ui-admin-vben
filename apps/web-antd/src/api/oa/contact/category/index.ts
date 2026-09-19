import { requestClient } from '#/api/request';

export namespace OaContactCategoryApi {
  /** OA 联系人分类 */
  export interface ContactCategory {
    id?: number; // 分类编号
    name: string; // 分类名称
    sort: number; // 显示排序
    createTime?: string; // 创建时间
  }
}

/** 查询联系人分类列表 */
export function getContactCategoryList() {
  return requestClient.get<OaContactCategoryApi.ContactCategory[]>(
    '/oa/contact-category/list',
  );
}

/** 查询联系人分类详情 */
export function getContactCategory(id: number) {
  return requestClient.get<OaContactCategoryApi.ContactCategory>(
    '/oa/contact-category/get',
    { params: { id } },
  );
}

/** 查询联系人分类精简列表 */
export function getSimpleContactCategoryList() {
  return requestClient.get<OaContactCategoryApi.ContactCategory[]>(
    '/oa/contact-category/simple-list',
  );
}

/** 新增联系人分类 */
export function createContactCategory(
  data: Partial<OaContactCategoryApi.ContactCategory>,
) {
  return requestClient.post<number>('/oa/contact-category/create', data);
}

/** 修改联系人分类 */
export function updateContactCategory(
  data: Partial<OaContactCategoryApi.ContactCategory>,
) {
  return requestClient.put<boolean>('/oa/contact-category/update', data);
}

/** 删除联系人分类 */
export function deleteContactCategory(id: number) {
  return requestClient.delete<boolean>('/oa/contact-category/delete', {
    params: { id },
  });
}
