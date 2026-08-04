import { requestClient } from '#/api/request';

export namespace HrmSalaryTaxRuleApi {
  export interface TaxRule {
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

export function createSalaryTaxRule(data: HrmSalaryTaxRuleApi.TaxRule) {
  return requestClient.post<number>('/hrm/salary/tax-rule/create', data);
}

export function updateSalaryTaxRule(data: HrmSalaryTaxRuleApi.TaxRule) {
  return requestClient.put<boolean>('/hrm/salary/tax-rule/update', data);
}

export function deleteSalaryTaxRule(id: number) {
  return requestClient.delete<boolean>('/hrm/salary/tax-rule/delete', {
    params: { id },
  });
}

export function getSalaryTaxRule(id: number) {
  return requestClient.get<HrmSalaryTaxRuleApi.TaxRule>(
    '/hrm/salary/tax-rule/get',
    { params: { id } },
  );
}

export function getSalaryTaxRuleList() {
  return requestClient.get<HrmSalaryTaxRuleApi.TaxRule[]>(
    '/hrm/salary/tax-rule/list',
  );
}
