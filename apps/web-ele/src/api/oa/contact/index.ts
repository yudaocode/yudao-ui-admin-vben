import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaContactApi {
  /** OA 联系人共享记录 */
  export interface ContactShare {
    id: number; // 共享记录编号
    userId: number; // 共享接收人用户编号
    userName?: string; // 共享接收人用户昵称
    userAvatar?: string; // 共享接收人用户头像
    categoryId?: number; // 接收人的分类编号
    categoryName?: string; // 接收人的分类名称
    handleStatus: boolean; // 处理状态
    creatorName?: string; // 实际共享人昵称
    createTime: string; // 共享时间
  }

  /** OA 联系人 */
  export interface Contact {
    id?: number; // 联系人编号
    ownerUserId?: number; // 创建人用户编号
    ownerUserName?: string; // 创建人用户昵称
    categoryId?: number; // 分类编号
    categoryName?: string; // 分类名称
    name: string; // 姓名
    pinyin?: string; // 姓名拼音
    sex?: number; // 性别
    mobile?: string; // 手机号码
    email?: string; // 邮箱
    address?: string; // 地址
    companyName?: string; // 公司名称
    companyPhone?: string; // 公司电话
    avatar?: string; // 头像地址
    remark?: string; // 备注
    shares?: ContactShare[]; // 共享记录列表
    share?: ContactShare; // 我共享的列表中当前行的接收关系
    sharerName?: string; // 分享给当前用户的共享人昵称
    handleStatus?: boolean; // 当前接收人的处理状态
    sharedCategoryId?: number; // 当前接收人的分类编号
    sharedCategoryName?: string; // 当前接收人的分类名称
    createTime?: string; // 创建时间
  }
}

/** 查询我的联系人分页 */
export function getMyContactPage(params: PageParam) {
  return requestClient.get<PageResult<OaContactApi.Contact>>(
    '/oa/contact/my-page',
    { params },
  );
}

/** 查询共享给我的联系人分页 */
export function getReceivedContactPage(params: PageParam) {
  return requestClient.get<PageResult<OaContactApi.Contact>>(
    '/oa/contact/received-page',
    { params },
  );
}

/** 查询我共享的联系人分页 */
export function getSharedContactPage(params: PageParam) {
  return requestClient.get<PageResult<OaContactApi.Contact>>(
    '/oa/contact/shared-page',
    { params },
  );
}

/** 查询联系人详情 */
export function getContact(id: number) {
  return requestClient.get<OaContactApi.Contact>('/oa/contact/get', {
    params: { id },
  });
}

/** 新增联系人 */
export function createContact(data: Partial<OaContactApi.Contact>) {
  return requestClient.post<number>('/oa/contact/create', data);
}

/** 修改联系人 */
export function updateContact(data: Partial<OaContactApi.Contact>) {
  return requestClient.put<boolean>('/oa/contact/update', data);
}

/** 删除联系人 */
export function deleteContact(id: number) {
  return requestClient.delete<boolean>('/oa/contact/delete', {
    params: { id },
  });
}

/** 删除接收到的共享联系人 */
export function deleteReceivedContact(contactId: number) {
  return requestClient.delete<boolean>('/oa/contact/delete-received', {
    params: { contactId },
  });
}

/** 共享联系人 */
export function shareContact(contactId: number, userIds: number[]) {
  return requestClient.post<boolean>('/oa/contact/share', {
    contactId,
    userIds,
  });
}

/** 处理联系人共享 */
export function handleContactShare(contactId: number, categoryId?: number) {
  return requestClient.put<boolean>('/oa/contact/handle-share', {
    contactId,
    categoryId,
  });
}
