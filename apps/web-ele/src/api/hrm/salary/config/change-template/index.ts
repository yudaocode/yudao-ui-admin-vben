import { requestClient } from '#/api/request';

export namespace HrmSalaryChangeTemplateApi {
  /** 调薪选项 */
  export interface ChangeOption {
    name: string; // 薪资项名称
    code: number; // 薪资项编码
  }

  /** 调薪模板 */
  export interface SalaryChangeTemplate {
    id?: number; // 调薪模板编号
    name: string; // 模板名称
    defaultStatus: boolean; // 是否默认模板
    options: ChangeOption[]; // 调薪项配置
    createTime?: Date; // 创建时间
  }
}

/** 查询调薪模板列表 */
export function getSalaryChangeTemplateList() {
  return requestClient.get<HrmSalaryChangeTemplateApi.SalaryChangeTemplate[]>(
    '/hrm/salary/change-template/list',
  );
}

/** 查询调薪模板 */
export function getSalaryChangeTemplate(id: number) {
  return requestClient.get<HrmSalaryChangeTemplateApi.SalaryChangeTemplate>(
    '/hrm/salary/change-template/get',
    { params: { id } },
  );
}

/** 新增调薪模板 */
export function createSalaryChangeTemplate(
  data: HrmSalaryChangeTemplateApi.SalaryChangeTemplate,
) {
  return requestClient.post<number>('/hrm/salary/change-template/create', data);
}

/** 修改调薪模板 */
export function updateSalaryChangeTemplate(
  data: HrmSalaryChangeTemplateApi.SalaryChangeTemplate,
) {
  return requestClient.put<boolean>('/hrm/salary/change-template/update', data);
}

/** 删除调薪模板 */
export function deleteSalaryChangeTemplate(id: number) {
  return requestClient.delete<boolean>('/hrm/salary/change-template/delete', {
    params: { id },
  });
}
