import { requestClient } from '#/api/request';

export namespace HrmEmployeeFileApi {
  export interface File {
    id?: number;
    employeeId?: number;
    type?: number;
    url?: string;
    createTime?: Date;
  }
  export interface SaveReq {
    employeeId: number;
    type: number;
    fileUrls: string[];
  }
}

export function getEmployeeFileList(employeeId: number) {
  return requestClient.get<HrmEmployeeFileApi.File[]>(
    '/hrm/employee/file/list',
    { params: { employeeId } },
  );
}
export function saveEmployeeFiles(data: HrmEmployeeFileApi.SaveReq) {
  return requestClient.put<boolean>('/hrm/employee/file/save', data);
}
