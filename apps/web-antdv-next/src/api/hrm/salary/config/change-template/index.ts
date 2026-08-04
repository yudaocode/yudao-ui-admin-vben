import { requestClient } from '#/api/request';

export namespace HrmSalaryChangeTemplateApi {
  export interface ChangeOption {
    name: string;
    code: number;
  }

  export interface ChangeTemplate {
    id?: number;
    name: string;
    defaultStatus: boolean;
    options: ChangeOption[];
    createTime?: Date;
  }
}

export function getSalaryChangeTemplateList() {
  return requestClient.get<HrmSalaryChangeTemplateApi.ChangeTemplate[]>(
    '/hrm/salary/change-template/list',
  );
}

export function getSalaryChangeTemplate(id: number) {
  return requestClient.get<HrmSalaryChangeTemplateApi.ChangeTemplate>(
    '/hrm/salary/change-template/get',
    { params: { id } },
  );
}

export function createSalaryChangeTemplate(
  data: HrmSalaryChangeTemplateApi.ChangeTemplate,
) {
  return requestClient.post<number>('/hrm/salary/change-template/create', data);
}

export function updateSalaryChangeTemplate(
  data: HrmSalaryChangeTemplateApi.ChangeTemplate,
) {
  return requestClient.put<boolean>('/hrm/salary/change-template/update', data);
}

export function deleteSalaryChangeTemplate(id: number) {
  return requestClient.delete<boolean>('/hrm/salary/change-template/delete', {
    params: { id },
  });
}
