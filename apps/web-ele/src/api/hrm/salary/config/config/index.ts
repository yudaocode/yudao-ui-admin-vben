import { requestClient } from '#/api/request';

export namespace HrmSalaryConfigApi {
  export interface Config {
    id?: number;
    cycleStartDay?: number;
    cycleEndDay?: number;
    socialSecurityMonthType?: number;
    startYear?: number;
    startMonth?: number;
    createTime?: Date;
  }

  export interface CreateReq {
    cycleStartDay: number;
    socialSecurityMonthType: number;
    startYear: number;
    startMonth: number;
  }

  export interface UpdateReq {
    socialSecurityMonthType: number;
  }
}

export function createSalaryConfig(data: HrmSalaryConfigApi.CreateReq) {
  return requestClient.post<number>('/hrm/salary/config/create', data);
}

export function updateSalaryConfig(data: HrmSalaryConfigApi.UpdateReq) {
  return requestClient.put<boolean>('/hrm/salary/config/update', data);
}

export function getSalaryConfig() {
  return requestClient.get<HrmSalaryConfigApi.Config>('/hrm/salary/config/get');
}
