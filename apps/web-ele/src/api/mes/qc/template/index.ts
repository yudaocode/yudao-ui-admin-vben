import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesQcTemplateApi {
  /** MES 质检方案 */
  export interface Template {
    id?: number; // 编号
    code?: string; // 方案编号
    name?: string; // 方案名称
    types?: number[]; // 检测种类
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询质检方案分页 */
export function getTemplatePage(params: PageParam) {
  return requestClient.get<PageResult<MesQcTemplateApi.Template>>(
    '/mes/qc/template/page',
    { params },
  );
}

/** 查询质检方案详情 */
export function getTemplate(id: number) {
  return requestClient.get<MesQcTemplateApi.Template>(
    `/mes/qc/template/get?id=${id}`,
  );
}

/** 新增质检方案 */
export function createTemplate(data: MesQcTemplateApi.Template) {
  return requestClient.post('/mes/qc/template/create', data);
}

/** 修改质检方案 */
export function updateTemplate(data: MesQcTemplateApi.Template) {
  return requestClient.put('/mes/qc/template/update', data);
}

/** 删除质检方案 */
export function deleteTemplate(id: number) {
  return requestClient.delete(`/mes/qc/template/delete?id=${id}`);
}

/** 导出质检方案 */
export function exportTemplate(params: any) {
  return requestClient.download('/mes/qc/template/export-excel', { params });
}
