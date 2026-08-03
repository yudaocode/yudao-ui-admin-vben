import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace HrmEmployeeApi {
  /** 员工档案 */
  export interface Employee {
    id?: number;
    name: string;
    jobNumber?: string;
    mobile?: string;
    deptId?: number;
    deptName?: string;
    postName?: string;
    type?: number;
    status?: number;
    entryTime?: number;
  }

  /** 员工部门统计 */
  export interface DeptStatistics {
    deptId: number;
    activeCount: number;
    fullTimeCount: number;
    nonFullTimeCount: number;
  }
}

/** 查询员工档案分页 */
export function getEmployeePage(params: PageParam) {
  return requestClient.get<PageResult<HrmEmployeeApi.Employee>>(
    '/hrm/employee/page',
    { params },
  );
}

/** 查询员工部门统计 */
export function getEmployeeDeptStatistics() {
  return requestClient.get<HrmEmployeeApi.DeptStatistics[]>(
    '/hrm/employee/dept-statistics',
  );
}
