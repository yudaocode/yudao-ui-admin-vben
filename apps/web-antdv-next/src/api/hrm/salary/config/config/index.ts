import { requestClient } from '#/api/request';

export namespace HrmSalaryConfigApi {
  /** 计薪设置 */
  export interface SalaryConfig {
    id?: number; // 编号
    cycleStartDay?: number; // 计薪周期开始日
    cycleEndDay?: number; // 计薪周期结束日
    socialSecurityMonthType?: number; // 社保对应月份类型
    startYear?: number; // 工资开始年份
    startMonth?: number; // 工资开始月份
    createTime?: Date; // 创建时间
  }

  /** 创建请求 */
  export interface CreateReq {
    cycleStartDay: number; // 计薪周期开始日
    socialSecurityMonthType: number; // 社保对应月份类型
    startYear: number; // 工资开始年份
    startMonth: number; // 工资开始月份
  }

  /** 修改请求 */
  export interface UpdateReq {
    socialSecurityMonthType: number; // 社保对应月份类型
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
