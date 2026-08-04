import type { HrmEmployeeCertificateApi } from '#/api/hrm/employee/certificate';

import { requestClient } from '#/api/request';

/** 获得当前员工的证书列表 */
export function getEmployeeCertificateList() {
  return requestClient.get<HrmEmployeeCertificateApi.EmployeeCertificate[]>(
    '/hrm/portal/employee/certificate/list',
  );
}
