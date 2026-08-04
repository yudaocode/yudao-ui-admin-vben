import { requestClient } from '#/api/request';

export namespace HrmSalaryConfigApi {
  /** 计薪设置 */
  export interface SalaryConfig {
    id?: number;
    cycleStartDay?: number;
    cycleEndDay?: number;
    socialSecurityMonthType?: number;
    startYear?: number;
    startMonth?: number;
    createTime?: Date;
  }

  /** 创建请求 */
  export interface CreateReq {
    cycleStartDay: number;
    socialSecurityMonthType: number;
    startYear: number;
    startMonth: number;
  }

  /** 修改请求 */
  export interface UpdateReq {
    socialSecurityMonthType: number;
  }
}

/** 新增计薪设置 */
export function createSalaryConfig(data: HrmSalaryConfigApi.CreateReq) {
  return requestClient.post<number>('/hrm/salary/config/create', data);
}

/** 修改计薪设置 */
export function updateSalaryConfig(data: HrmSalaryConfigApi.UpdateReq) {
  return requestClient.put<boolean>('/hrm/salary/config/update', data);
}

/** 查询计薪设置 */
export function getSalaryConfig() {
  return requestClient.get<HrmSalaryConfigApi.SalaryConfig>(
    '/hrm/salary/config/get',
  );
}
