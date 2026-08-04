import { requestClient } from '#/api/request';

export namespace HrmSalaryOptionApi {
  /** 选项值 */
  export interface OptionValue {
    code?: number;
    name?: string;
    value?: number;
  }

  /** 工资项 */
  export interface SalaryOption {
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
    children?: SalaryOption[];
    createTime: Date;
  }

  /** 保存请求 */
  export interface SaveReq {
    parentCode?: number;
    name: string;
    remark?: string;
  }
}

/** 查询工资项精简列表 */
export function getSalaryOptionSimpleList(adjustable?: boolean) {
  return requestClient.get<HrmSalaryOptionApi.SalaryOption[]>(
    '/hrm/salary/option/simple-list',
    {
      params: { adjustable },
    },
  );
}

/** 查询工资项列表 */
export function getSalaryOptionList() {
  return requestClient.get<HrmSalaryOptionApi.SalaryOption[]>(
    '/hrm/salary/option/list',
  );
}

/** 新增工资项 */
export function createSalaryOption(data: HrmSalaryOptionApi.SaveReq) {
  return requestClient.post<number>('/hrm/salary/option/create', data);
}

/** 修改工资项启用状态 */
export function updateSalaryOptionEnabled(id: number, enabled: boolean) {
  return requestClient.put<boolean>('/hrm/salary/option/update-enabled', {
    id,
    enabled,
  });
}

/** 修改工资项可见性 */
export function updateSalaryOptionVisible(id: number, visible: boolean) {
  return requestClient.put<boolean>('/hrm/salary/option/update-visible', {
    id,
    visible,
  });
}

/** 删除工资项 */
export function deleteSalaryOption(id: number) {
  return requestClient.delete<boolean>('/hrm/salary/option/delete', {
    params: { id },
  });
}

/** syncSalaryOption */
export function syncSalaryOption() {
  return requestClient.put<boolean>('/hrm/salary/option/sync');
}
