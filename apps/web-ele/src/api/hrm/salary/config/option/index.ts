import { requestClient } from '#/api/request';

export namespace HrmSalaryOptionApi {
  export interface OptionValue {
    code?: number;
    name?: string;
    value?: number;
  }

  export interface Option {
    id: number;
    code: number;
    parentCode: number;
    name: string;
    remark?: string;
    systemFlag: boolean;
    type: number;
    taxEnabled: boolean;
    visible: boolean;
    calculateEnabled: boolean;
    enabled: boolean;
    templateId?: number;
    children?: Option[];
    createTime: Date;
  }

  export interface SaveReq {
    parentCode?: number;
    name: string;
    remark?: string;
  }
}

export function getSalaryOptionSimpleList(adjustable?: boolean) {
  return requestClient.get<HrmSalaryOptionApi.Option[]>(
    '/hrm/salary/option/simple-list',
    {
      params: { adjustable },
    },
  );
}

export function getSalaryOptionList() {
  return requestClient.get<HrmSalaryOptionApi.Option[]>(
    '/hrm/salary/option/list',
  );
}

export function createSalaryOption(data: HrmSalaryOptionApi.SaveReq) {
  return requestClient.post<number>('/hrm/salary/option/create', data);
}

export function updateSalaryOptionEnabled(id: number, enabled: boolean) {
  return requestClient.put<boolean>('/hrm/salary/option/update-enabled', {
    id,
    enabled,
  });
}

export function updateSalaryOptionVisible(id: number, visible: boolean) {
  return requestClient.put<boolean>('/hrm/salary/option/update-visible', {
    id,
    visible,
  });
}

export function deleteSalaryOption(id: number) {
  return requestClient.delete<boolean>('/hrm/salary/option/delete', {
    params: { id },
  });
}

export function syncSalaryOption() {
  return requestClient.put<boolean>('/hrm/salary/option/sync');
}
