import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmSalaryGroupApi {
  export interface Group {
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

export function createSalaryGroup(data: HrmSalaryGroupApi.Group) {
  return requestClient.post<number>('/hrm/salary/group/create', data);
}

export function updateSalaryGroup(data: HrmSalaryGroupApi.Group) {
  return requestClient.put<boolean>('/hrm/salary/group/update', data);
}

export function deleteSalaryGroup(id: number) {
  return requestClient.delete<boolean>('/hrm/salary/group/delete', {
    params: { id },
  });
}

export function getSalaryGroup(id: number) {
  return requestClient.get<HrmSalaryGroupApi.Group>('/hrm/salary/group/get', {
    params: { id },
  });
}

export function getSalaryGroupPage(params: PageParam) {
  return requestClient.get<PageResult<HrmSalaryGroupApi.Group>>(
    '/hrm/salary/group/page',
    { params },
  );
}

export function getSalaryGroupSimpleList() {
  return requestClient.get<HrmSalaryGroupApi.Group[]>(
    '/hrm/salary/group/simple-list',
  );
}
