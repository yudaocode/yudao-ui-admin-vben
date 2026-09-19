import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaOfficialDocTemplateApi {
  /** OA 公文套红模板 */
  export interface OfficialDocTemplate {
    id?: number; // 编号
    name?: string; // 模板名称
    authorityName?: string; // 红头名称
    fontSize?: number; // 红头字号
    noPrefix?: string; // 发文字号前缀
    sealPicUrl?: string; // 印章图片地址
    separatorType?: number; // 分隔线类型
    status?: number; // 状态
    sort?: number; // 显示顺序
    remark?: string; // 备注
    creator?: string; // 创建人编号
    createTime?: string; // 创建时间
  }
}

/** 查询套红模板分页 */
export function getOfficialDocTemplatePage(params: PageParam) {
  return requestClient.get<
    PageResult<OaOfficialDocTemplateApi.OfficialDocTemplate>
  >('/oa/officialdoc-template/page', { params });
}

/** 查询套红模板 */
export function getOfficialDocTemplate(id: number) {
  return requestClient.get<OaOfficialDocTemplateApi.OfficialDocTemplate>(
    '/oa/officialdoc-template/get',
    { params: { id } },
  );
}

/** 新增套红模板 */
export function createOfficialDocTemplate(
  data: Partial<OaOfficialDocTemplateApi.OfficialDocTemplate>,
) {
  return requestClient.post<number>('/oa/officialdoc-template/create', data);
}

/** 修改套红模板 */
export function updateOfficialDocTemplate(
  data: Partial<OaOfficialDocTemplateApi.OfficialDocTemplate>,
) {
  return requestClient.put<boolean>('/oa/officialdoc-template/update', data);
}

/** 删除套红模板 */
export function deleteOfficialDocTemplate(id: number) {
  return requestClient.delete<boolean>('/oa/officialdoc-template/delete', {
    params: { id },
  });
}

/** 查询套红模板精简列表 */
export function getSimpleOfficialDocTemplateList() {
  return requestClient.get<OaOfficialDocTemplateApi.OfficialDocTemplate[]>(
    '/oa/officialdoc-template/simple-list',
  );
}
