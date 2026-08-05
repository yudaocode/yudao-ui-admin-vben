import { requestClient } from '#/api/request';

export namespace HrmEmployeeFileApi {
  /** 员工附件 */
  export interface EmployeeFile {
    id?: number; // 附件编号
    employeeId?: number; // 员工编号
    type?: number; // 附件类型
    url?: string; // 附件地址
    createTime?: Date; // 创建时间
  }
  /** 保存请求 */
  export interface SaveReq {
    employeeId: number; // 员工编号
    type: number; // 附件类型
    fileUrls: string[]; // 附件地址数组
  }
}

/** 查询员工附件列表 */
export function getEmployeeFileList(employeeId: number) {
  return requestClient.get<HrmEmployeeFileApi.EmployeeFile[]>(
    '/hrm/employee/file/list',
    { params: { employeeId } },
  );
}

/** 保存员工附件 */
export function saveEmployeeFiles(data: HrmEmployeeFileApi.SaveReq) {
  return requestClient.put<boolean>('/hrm/employee/file/save', data);
}
