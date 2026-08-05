import { requestClient } from '#/api/request';

export namespace HrmSalaryOptionApi {
  /** 选项值 */
  export interface OptionValue {
    code?: number; // 编码
    name?: string; // 薪资项名称
    value?: number; // 值
  }

  /** 工资项 */
  export interface SalaryOption {
    id: number; // 编号
    code: number; // 编码
    parentCode: number; // 父薪资项编码
    name: string; // 薪资项名称
    remark?: string; // 备注
    systemFlag: boolean; // 是否系统内置
    type: number; // 薪资项类型
    taxEnabled: boolean; // 是否计税
    visible: boolean; // 是否显示
    calculateEnabled: boolean; // 是否参与计算
    enabled: boolean; // 是否启用
    templateId?: number; // 标准薪资项目录编号
    children?: SalaryOption[]; // 子工资条项
    createTime: Date; // 创建时间
  }

  /** 保存请求 */
  export interface SaveReq {
    parentCode?: number; // 父薪资项编码
    name: string; // 薪资项名称
    remark?: string; // 备注
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
