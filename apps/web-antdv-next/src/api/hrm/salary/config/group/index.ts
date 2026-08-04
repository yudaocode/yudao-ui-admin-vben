import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmSalaryGroupApi {
  /** 薪资组 */
  export interface SalaryGroup {
    id?: number;
    name: string;
    salaryStandard?: number;
    changeRule?: string;
    taxRuleId?: number;
    taxRuleName?: string;
    deptIds?: number[];
    deptNames?: string[];
    employeeIds?: number[];
    employeeNames?: string[];
    createTime?: Date;
  }
}

/** 新增薪资组 */
export function createSalaryGroup(data: HrmSalaryGroupApi.SalaryGroup) {
  return requestClient.post<number>('/hrm/salary/group/create', data);
}

/** 修改薪资组 */
export function updateSalaryGroup(data: HrmSalaryGroupApi.SalaryGroup) {
  return requestClient.put<boolean>('/hrm/salary/group/update', data);
}

/** 删除薪资组 */
export function deleteSalaryGroup(id: number) {
  return requestClient.delete<boolean>('/hrm/salary/group/delete', {
    params: { id },
  });
}

/** 查询薪资组 */
export function getSalaryGroup(id: number) {
  return requestClient.get<HrmSalaryGroupApi.SalaryGroup>(
    '/hrm/salary/group/get',
    {
      params: { id },
    },
  );
}

/** 查询薪资组分页 */
export function getSalaryGroupPage(params: PageParam) {
  return requestClient.get<PageResult<HrmSalaryGroupApi.SalaryGroup>>(
    '/hrm/salary/group/page',
    { params },
  );
}

/** 查询薪资组精简列表 */
export function getSalaryGroupSimpleList() {
  return requestClient.get<HrmSalaryGroupApi.SalaryGroup[]>(
    '/hrm/salary/group/simple-list',
  );
}
