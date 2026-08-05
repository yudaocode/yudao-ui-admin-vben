import { requestClient } from '#/api/request';

export namespace HrmSalarySlipTemplateApi {
  /** 工资条模板薪资项 */
  export interface TemplateOption {
    name?: string; // 工资项名称
    type?: number; // 工资项类型
    code?: number; // 编码
    remark?: string; // 备注
    parentCode?: number; // 父薪资项编码
    hidden?: boolean; // 是否隐藏
    sort?: number; // 排序
  }

  /** 工资条模板 */
  export interface SalarySlipTemplate {
    id?: number; // 编号
    name: string; // 模板名称
    hideEmpty?: boolean; // 是否隐藏空值项
    defaultStatus?: boolean; // 是否默认模板
    options?: TemplateOption[]; // 选项列表
    createTime?: Date; // 创建时间
  }
}

/** 创建工资条模板 */
export function createSalarySlipTemplate(
  data: HrmSalarySlipTemplateApi.SalarySlipTemplate,
) {
  return requestClient.post<number>('/hrm/salary/slip-template/create', data);
}

/** 更新工资条模板 */
export function updateSalarySlipTemplate(
  data: HrmSalarySlipTemplateApi.SalarySlipTemplate,
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
  return requestClient.get<HrmSalarySlipTemplateApi.SalarySlipTemplate>(
    '/hrm/salary/slip-template/get',
    { params: { id } },
  );
}

/** 获得工资条模板列表 */
export function getSalarySlipTemplateList() {
  return requestClient.get<HrmSalarySlipTemplateApi.SalarySlipTemplate[]>(
    '/hrm/salary/slip-template/list',
  );
}
