import { requestClient } from '#/api/request';

export namespace HrmPortalInsuranceRecordApi {
  /** SchemeProject */
  export interface SchemeProject {
    schemeProjectId?: number; // 社保项目编号
    type?: number; // 社保项目类型
    name: string; // 社保项目名称
    baseAmount?: number; // 缴纳基数
    corporateRate?: number; // 公司缴纳比例
    personalRate?: number; // 个人缴纳比例
    corporateAmount?: number; // 公司缴纳金额
    personalAmount?: number; // 个人缴纳金额
  }

  /** 员工端社保记录 */
  export interface PortalInsuranceRecord {
    id: number; // 编号
    monthRecordId?: number; // 工资表编号
    employeeId: number; // 员工编号
    schemeId?: number; // 社保方案编号
    schemeName?: string; // 社保方案名称
    schemeType?: number; // 社保方案类型
    schemeCity?: string; // 参保城市
    year: number; // 年份
    month: number; // 月份
    personalInsuranceAmount?: number; // 个人社保金额
    personalProvidentFundAmount?: number; // 个人公积金金额
    corporateInsuranceAmount?: number; // 公司社保金额
    corporateProvidentFundAmount?: number; // 公司公积金金额
    status?: number; // 参保状态
    createTime?: Date; // 创建时间
    projects?: SchemeProject[]; // 社保项目列表
  }
}

/** 获得我的社保记录列表 */
export function getInsuranceRecordList(params?: { year?: number }) {
  return requestClient.get<HrmPortalInsuranceRecordApi.PortalInsuranceRecord[]>(
    '/hrm/portal/insurance/record/list',
    { params },
  );
}

/** 获得我的社保记录详情 */
export function getInsuranceRecord(id: number) {
  return requestClient.get<HrmPortalInsuranceRecordApi.PortalInsuranceRecord>(
    '/hrm/portal/insurance/record/get',
    { params: { id } },
  );
}
