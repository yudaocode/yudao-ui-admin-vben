import { requestClient } from '#/api/request';

export namespace HrmHomeApi {
  /** HR 工作台员工概览 */
  export interface HrHomeEmployeeSurvey {
    activeCount: number; // 在职员工数量
    entryThisMonthCount: number; // 本月入职员工数量
    pendingEntryThisMonthCount: number; // 本月待入职员工数量
    leaveThisMonthCount: number; // 本月离职员工数量
    pendingLeaveThisMonthCount: number; // 本月待离职员工数量
    regularThisMonthCount: number; // 本月转正员工数量
    transferThisMonthCount: number; // 本月调岗员工数量
  }

  /** HR 工作台招聘概览 */
  export interface HrHomeRecruitSurvey {
    recruitingPostCount: number; // 招聘中职位数量
    candidateInProcessCount: number; // 流程中候选人数量
    pendingEntryCount: number; // 待入职候选人数量
    joinedCount: number; // 已入职候选人数量
  }

  /** HR 工作台部门薪资占比 */
  export interface HrHomeSalaryDept {
    deptId: number; // 部门编号
    deptName: string; // 部门名称
    proportion: number; // 薪资占比
    totalSalary: number; // 实发工资
  }

  /** HR 工作台薪资概览 */
  export interface HrHomeSalarySurvey {
    monthRecordId?: number; // 月度工资表编号
    employeeCount: number; // 计薪员工数量
    realPaySalary: number; // 实发工资合计
    deptProportions: HrHomeSalaryDept[]; // 部门薪资占比
  }

  /** HR 工作台待办概览 */
  export interface HrHomeTodoSurvey {
    toEntryCount: number; // 待入职数量
    toLeaveCount: number; // 待离职数量
    toExpireContractCount: number; // 合同待到期数量
    toRegularCount: number; // 待转正数量
    toSalaryComputeCount: number; // 待核算工资表数量
    toBirthdayCount: number; // 本月生日员工数量
  }

  /** HR 工作台统计响应 */
  export interface HrHomeStatisticsResp {
    employeeSurvey: HrHomeEmployeeSurvey; // 员工概览
    recruitSurvey: HrHomeRecruitSurvey; // 招聘概览
    salarySurvey: HrHomeSalarySurvey; // 薪资概览
    todoSurvey: HrHomeTodoSurvey; // 待办概览
  }

  /** 团队工作台统计分析项 */
  export interface TeamHomeAnalysisItem {
    type: null | number; // 分类类型，null 表示未填写
    count: number; // 数量
  }

  /** 团队工作台我的团队 */
  export interface TeamHomeOverview {
    employeeCount: number; // 团队人数
    entryThisMonthCount: number; // 本月入职人数
    leaveThisMonthCount: number; // 本月离职人数
    regularThisMonthCount: number; // 本月转正人数
  }

  /** 团队工作台团队概况 */
  export interface TeamHomeSurvey {
    statusAnalysis: TeamHomeAnalysisItem[]; // 员工状态占比
    sexAnalysis: TeamHomeAnalysisItem[]; // 男女性别占比
    ageAnalysis: TeamHomeAnalysisItem[]; // 成员年龄占比
    companyAgeAnalysis: TeamHomeAnalysisItem[]; // 成员司龄占比
  }

  /** 团队工作台统计响应 */
  export interface TeamHomeStatisticsResp {
    leaderEmployeeId?: number; // 当前登录员工编号
    teamOverview: TeamHomeOverview; // 我的团队
    teamSurvey: TeamHomeSurvey; // 团队概况
  }

  /** 首页日历事项 */
  export interface HomeCalendarItem {
    personalNoteId?: number; // 员工个人备忘编号
    type: number; // 事项类型
    typeName: string; // 事项类型名称
    content: string; // 事项内容
    typeId?: number; // 关联业务编号
    date: string; // 事项日期
    eventTime?: Date | number | string; // 事项时间
  }
}

/** 获得 HR 工作台统计汇总 */
export function getHrHomeStatisticsSummary() {
  return requestClient.get<HrmHomeApi.HrHomeStatisticsResp>(
    '/hrm/home/hr-statistics-summary',
  );
}

/** 获得 HR 工作台日历 */
export function getHrHomeCalendar(params: {
  endDate: string;
  startDate: string;
}) {
  return requestClient.get<HrmHomeApi.HomeCalendarItem[]>(
    '/hrm/home/hr-calendar',
    { params },
  );
}

/** 获得团队工作台统计汇总 */
export function getTeamHomeStatisticsSummary() {
  return requestClient.get<HrmHomeApi.TeamHomeStatisticsResp>(
    '/hrm/home/team-statistics-summary',
  );
}

/** 获得团队工作台日历 */
export function getTeamHomeCalendar(params: {
  endDate: string;
  startDate: string;
}) {
  return requestClient.get<HrmHomeApi.HomeCalendarItem[]>(
    '/hrm/home/team-calendar',
    { params },
  );
}
