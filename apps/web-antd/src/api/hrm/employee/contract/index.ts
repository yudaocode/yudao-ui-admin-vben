import { requestClient } from '#/api/request';

export namespace HrmEmployeeContractApi {
  /** 员工合同 */
  export interface EmployeeContract {
    id?: number; // 合同编号
    employeeId?: number; // 员工编号
    no?: string; // 合同编码
    type?: number; // 合同类型
    startTime?: number; // 合同开始日期
    endTime?: number; // 合同结束日期
    term?: number; // 合同期限
    status?: number; // 合同状态
    signCompany?: string; // 签约公司
    signTime?: number; // 合同签订日期
    remark?: string; // 备注
    expireRemind?: boolean; // 是否到期提醒
    fileUrls?: string[]; // 附件地址数组
    sort?: number; // 排序
    createTime?: Date; // 创建时间
  }
}

/** 查询员工合同列表 */
export function getEmployeeContractList(employeeId: number) {
  return requestClient.get<HrmEmployeeContractApi.EmployeeContract[]>(
    '/hrm/employee/contract/list',
    { params: { employeeId } },
  );
}

/** 新增员工合同 */
export function createEmployeeContract(
  data: HrmEmployeeContractApi.EmployeeContract,
) {
  return requestClient.post<number>('/hrm/employee/contract/create', data);
}

/** 修改员工合同 */
export function updateEmployeeContract(
  data: HrmEmployeeContractApi.EmployeeContract,
) {
  return requestClient.put<boolean>('/hrm/employee/contract/update', data);
}

/** 删除员工合同 */
export function deleteEmployeeContract(id: number) {
  return requestClient.delete<boolean>('/hrm/employee/contract/delete', {
    params: { id },
  });
}
