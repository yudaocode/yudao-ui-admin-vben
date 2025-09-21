import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ContactApi {
  /** 联系人信息 */
  export interface Contact {
    id: number; // 编号
    name?: string; // 姓名
    index?: string; // 索引
    mobile?: string; // 手机号码
    email: string; // 电子邮件
    emergency: boolean; // 紧急联系人
    relationship: string; // 与本人关系
    userId?: number; // 用户编号
  }
}

/** 查询联系人分页 */
export function getContactPage(params: PageParam) {
  return requestClient.get<PageResult<ContactApi.Contact>>(
    '/member/contact/page',
    { params },
  );
}

/** 查询联系人详情 */
export function getContact(id: number) {
  return requestClient.get<ContactApi.Contact>(`/member/contact/get?id=${id}`);
}

/** 新增联系人 */
export function createContact(data: ContactApi.Contact) {
  return requestClient.post('/member/contact/create', data);
}

/** 修改联系人 */
export function updateContact(data: ContactApi.Contact) {
  return requestClient.put('/member/contact/update', data);
}

/** 删除联系人 */
export function deleteContact(id: number) {
  return requestClient.delete(`/member/contact/delete?id=${id}`);
}

/** 批量删除联系人 */
export function deleteContactList(ids: number[]) {
  return requestClient.delete(
    `/member/contact/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出联系人 */
export function exportContact(params: any) {
  return requestClient.download('/member/contact/export-excel', params);
}
