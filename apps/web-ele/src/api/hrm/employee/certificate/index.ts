import { requestClient } from '#/api/request';

export namespace HrmEmployeeCertificateApi {
  export interface Certificate {
    id?: number;
    employeeId?: number;
    name?: string;
    level?: string;
    no?: string;
    startTime?: number;
    endTime?: number;
    issuingAuthority?: string;
    issuingTime?: number;
    remark?: string;
    sort?: number;
    createTime?: Date;
  }
}

export function getEmployeeCertificateList(employeeId: number) {
  return requestClient.get<HrmEmployeeCertificateApi.Certificate[]>(
    '/hrm/employee/certificate/list',
    { params: { employeeId } },
  );
}
export function createEmployeeCertificate(
  data: HrmEmployeeCertificateApi.Certificate,
) {
  return requestClient.post<number>('/hrm/employee/certificate/create', data);
}
export function updateEmployeeCertificate(
  data: HrmEmployeeCertificateApi.Certificate,
) {
  return requestClient.put<boolean>('/hrm/employee/certificate/update', data);
}
export function deleteEmployeeCertificate(id: number) {
  return requestClient.delete<boolean>('/hrm/employee/certificate/delete', {
    params: { id },
  });
}
