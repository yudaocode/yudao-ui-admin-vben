import type { PageParam, PageResult } from '@vben/request';

import type { DiyPageApi } from './page';

import { requestClient } from '#/api/request';

export namespace DiyTemplateApi {
  /** 装修模板 */
  export interface DiyTemplate {
    /** 模板编号 */
    id?: number;
    /** 模板名称 */
    name: string;
    /** 是否使用 */
    used: boolean;
    /** 使用时间 */
    usedTime?: Date;
    /** 备注 */
    remark: string;
    /** 预览图片地址数组 */
    previewPicUrls: string[];
    /** 模板属性 */
    property: string;
  }

  /** 装修模板属性（包含页面列表） */
  export interface DiyTemplateProperty extends DiyTemplate {
    /** 页面列表 */
    pages: DiyPageApi.DiyPage[];
  }
}

/** 查询装修模板列表 */
export function getDiyTemplatePage(params: PageParam) {
  return requestClient.get<PageResult<DiyTemplateApi.DiyTemplate>>(
    '/promotion/diy-template/page',
    { params },
  );
}

/** 查询装修模板详情 */
export function getDiyTemplate(id: number) {
  return requestClient.get<DiyTemplateApi.DiyTemplate>(
    `/promotion/diy-template/get?id=${id}`,
  );
}

/** 新增装修模板 */
export function createDiyTemplate(data: DiyTemplateApi.DiyTemplate) {
  return requestClient.post('/promotion/diy-template/create', data);
}

/** 修改装修模板 */
export function updateDiyTemplate(data: DiyTemplateApi.DiyTemplate) {
  return requestClient.put('/promotion/diy-template/update', data);
}

/** 删除装修模板 */
export function deleteDiyTemplate(id: number) {
  return requestClient.delete(`/promotion/diy-template/delete?id=${id}`);
}

/** 使用装修模板 */
export function useDiyTemplate(id: number) {
  return requestClient.put(`/promotion/diy-template/use?id=${id}`);
}

/** 获得装修模板属性 */
export function getDiyTemplateProperty(id: number) {
  return requestClient.get<DiyTemplateApi.DiyTemplateProperty>(
    `/promotion/diy-template/get-property?id=${id}`,
  );
}

/** 更新装修模板属性 */
export function updateDiyTemplateProperty(data: DiyTemplateApi.DiyTemplate) {
  return requestClient.put('/promotion/diy-template/update-property', data);
}
