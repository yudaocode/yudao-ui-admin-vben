import { requestClient } from '#/api/request';

export namespace HrmSalaryTaxRuleApi {
  /** 计税规则 */
  export interface SalaryTaxRule {
    id?: number; // 编号
    name: string; // 计税规则名称
    type?: number; // 计税类型
    taxEnabled?: boolean; // 是否计税
    threshold?: number; // 起征阈值
    decimalScale?: number; // 小数位数
    cycleType?: number; // 计税周期类型
    usedGroupCount?: number; // 使用该规则的薪资组数量
    createTime?: Date; // 创建时间
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
