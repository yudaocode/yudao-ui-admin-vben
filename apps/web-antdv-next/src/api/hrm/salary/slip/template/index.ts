import { requestClient } from '#/api/request';

export namespace HrmSalarySlipTemplateApi {
  /** 工资条模板薪资项 */
  export interface TemplateOption {
    name?: string;
    type?: number;
    code?: number;
    remark?: string;
    parentCode?: number;
    hidden?: boolean;
    sort?: number;
  }

  /** 工资条模板 */
  export interface Template {
    id?: number;
    name: string;
    hideEmpty?: boolean;
    defaultStatus?: boolean;
    options?: TemplateOption[];
    createTime?: Date;
  }
}

/** 创建工资条模板 */
export function createSalarySlipTemplate(
  data: HrmSalarySlipTemplateApi.Template,
) {
  return requestClient.post<number>('/hrm/salary/slip-template/create', data);
}

/** 更新工资条模板 */
export function updateSalarySlipTemplate(
  data: HrmSalarySlipTemplateApi.Template,
) {
  return requestClient.put<boolean>('/hrm/salary/slip-template/update', data);
}

/** 删除工资条模板 */
export function deleteSalarySlipTemplate(id: number) {
  return requestClient.delete<boolean>('/hrm/salary/slip-template/delete', {
    params: { id },
  });
}

/** 获得工资条模板详情 */
export function getSalarySlipTemplate(id: number) {
  return requestClient.get<HrmSalarySlipTemplateApi.Template>(
    '/hrm/salary/slip-template/get',
    { params: { id } },
  );
}

/** 获得工资条模板列表 */
export function getSalarySlipTemplateList() {
  return requestClient.get<HrmSalarySlipTemplateApi.Template[]>(
    '/hrm/salary/slip-template/list',
  );
}
