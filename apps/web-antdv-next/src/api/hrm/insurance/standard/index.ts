import { requestClient } from '#/api/request';

export namespace HrmInsuranceStandardApi {
  /** Type */
  export interface Type {
    code: string; // 编码
    name: string; // 类型名称
  }

  /** 社保项目 */
  export interface Project {
    type: number; // 聘用形式
    name: string; // 模板名称
    baseAmount?: number; // 缴纳基数
    corporateRate?: number; // 公司缴纳比例
    personalRate?: number; // 个人缴纳比例
    corporateAmount?: number; // 公司缴纳金额
    personalAmount?: number; // 个人缴纳金额
  }
}

/** 查询InsuranceStandardTypeList */
export function getInsuranceStandardTypeList(areaId: number) {
  return requestClient.get<HrmInsuranceStandardApi.Type[]>(
    '/hrm/insurance/standard/type-list',
    { params: { areaId } },
  );
}

/** 查询InsuranceStandardProjectList */
export function getInsuranceStandardProjectList(params: {
  areaId: number;
  typeCode: string;
}) {
  return requestClient.get<HrmInsuranceStandardApi.Project[]>(
    '/hrm/insurance/standard/project-list',
    { params },
  );
}
