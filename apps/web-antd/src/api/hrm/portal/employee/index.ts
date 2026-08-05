import { requestClient } from '#/api/request';

export namespace HrmPortalEmployeeApi {
  /** 员工端档案 */
  export interface PortalEmployee {
    id: number; // 员工档案编号
    name?: string; // 员工姓名
    avatar?: string; // 员工头像
    jobNumber?: string; // 工号
    mobile?: string; // 手机号
    country?: string; // 国家或地区
    nation?: string; // 民族
    idType?: number; // 证件类型
    idNumber?: string; // 证件号码
    sex?: number; // 性别
    email?: string; // 邮箱
    nativePlace?: string; // 籍贯
    birthday?: number; // 出生日期
    age?: number; // 年龄
    address?: string; // 户籍地址
    highestEducation?: number; // 最高学历
    deptId?: number; // 部门编号
    deptName?: string; // 部门名称
    leaderEmployeeId?: number; // 直属上级员工编号
    leaderEmployeeName?: string; // 直属上级员工姓名
    entryStatus?: number; // 入职状态
    status?: number; // 员工状态
    type?: number; // 聘用形式
    entryTime?: Date | number; // 入职时间
    entryDay: number; // 入职天数
    probation?: number; // 试用期，单位月
    regularTime?: Date | number; // 转正时间
    leaveTime?: Date | number; // 离职时间
    postName?: string; // 职位名称
    postLevel?: string; // 岗位职级
    workCity?: string; // 工作城市
    workAddress?: string; // 工作地点
    workDetailAddress?: string; // 工作详细地址
    companyAgeStartTime?: Date | number; // 司龄开始时间
    companyAge?: number; // 司龄，单位年
  }

  /** 员工更新请求 */
  export interface EmployeeUpdateReq {
    name?: string; // 员工姓名
    mobile?: string; // 手机号
    country?: string; // 国家或地区
    nation?: string; // 民族
    idType?: number; // 证件类型
    idNumber?: string; // 证件号码
    sex?: number; // 性别
    email?: string; // 邮箱
    nativePlace?: string; // 籍贯
    birthday?: number; // 出生日期
    address?: string; // 户籍地址
    highestEducation?: number; // 最高学历
  }
}

/** 获得当前账号的员工绑定状态 */
export function getEmployeeBindStatus() {
  return requestClient.get<boolean>('/hrm/portal/employee/get-bind-status');
}

/** 获得当前员工档案 */
export function getEmployee() {
  return requestClient.get<HrmPortalEmployeeApi.PortalEmployee>(
    '/hrm/portal/employee/get',
  );
}

/** 修改当前员工档案 */
export function updateEmployee(data: HrmPortalEmployeeApi.EmployeeUpdateReq) {
  return requestClient.put<boolean>('/hrm/portal/employee/update', data);
}
