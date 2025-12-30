import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ContactTemplateApi {
  /** 联系模版信息 */
  export interface ContactTemplate {
    id: number; // 编号
    userId?: number; // 用户ID
    assistantId?: number; // 助理ID
    type: string; // 消息类型
    title: string; // 模版标题
    content: string; // 内容
    isTellTime: number; // 是否告诉对方你的时间
    yourTime: string; // 你的时间
    isTellLocation: number; // 是否告诉对方你的地点
    yourLocation: string; // 你的地点
    remark: string; // 备注
  }
}

/** 查询联系模版分页 */
export function getContactTemplatePage(params: PageParam) {
  return requestClient.get<PageResult<ContactTemplateApi.ContactTemplate>>(
    '/mpr/contact-template/page',
    { params },
  );
}
/** 查询助理的联系模版列表 */
export function getAssistantContactTemplateList(assistantId: number) {
  return requestClient.get<ContactTemplateApi.ContactTemplate[]>(
    `/mpr/contact-template/getAssistantTemplateList?assistantId=${assistantId}`,
  );
}

/** 查询联系模版详情 */
export function getContactTemplate(id: number) {
  return requestClient.get<ContactTemplateApi.ContactTemplate>(
    `/mpr/contact-template/get?id=${id}`,
  );
}

/** 新增联系模版 */
export function createContactTemplate(
  data: ContactTemplateApi.ContactTemplate,
) {
  return requestClient.post('/mpr/contact-template/create', data);
}

/** 修改联系模版 */
export function updateContactTemplate(
  data: ContactTemplateApi.ContactTemplate,
) {
  return requestClient.put('/mpr/contact-template/update', data);
}

/** 删除联系模版 */
export function deleteContactTemplate(id: number) {
  return requestClient.delete(`/mpr/contact-template/delete?id=${id}`);
}

/** 批量删除联系模版 */
export function deleteContactTemplateList(ids: number[]) {
  return requestClient.delete(
    `/mpr/contact-template/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出联系模版 */
export function exportContactTemplate(params: any) {
  return requestClient.download('/mpr/contact-template/export-excel', params);
}
