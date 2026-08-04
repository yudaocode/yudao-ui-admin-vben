import { requestClient } from '#/api/request';

export namespace HrmSalaryTaxRuleApi {
  /** 计税规则 */
  export interface SalaryTaxRule {
    id?: number;
    name: string;
    type?: number;
    taxEnabled?: boolean;
    threshold?: number;
    decimalScale?: number;
    cycleType?: number;
    usedGroupCount?: number;
    createTime?: Date;
  }
}

/** 新增计税规则 */
export function createSalaryTaxRule(data: HrmSalaryTaxRuleApi.SalaryTaxRule) {
  return requestClient.post<number>('/hrm/salary/tax-rule/create', data);
}

/** 修改计税规则 */
export function updateSalaryTaxRule(data: HrmSalaryTaxRuleApi.SalaryTaxRule) {
  return requestClient.put<boolean>('/hrm/salary/tax-rule/update', data);
}

/** 删除计税规则 */
export function deleteSalaryTaxRule(id: number) {
  return requestClient.delete<boolean>('/hrm/salary/tax-rule/delete', {
    params: { id },
  });
}

/** 查询计税规则 */
export function getSalaryTaxRule(id: number) {
  return requestClient.get<HrmSalaryTaxRuleApi.SalaryTaxRule>(
    '/hrm/salary/tax-rule/get',
    { params: { id } },
  );
}

/** 查询计税规则列表 */
export function getSalaryTaxRuleList() {
  return requestClient.get<HrmSalaryTaxRuleApi.SalaryTaxRule[]>(
    '/hrm/salary/tax-rule/list',
  );
}
