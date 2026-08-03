/** 招聘候选人状态枚举（对齐后端 HrmRecruitCandidateStatusEnum） */
export const HrmRecruitCandidateStatus = {
  NEW: 1, // 新候选人
  PRIMARY_PASS: 2, // 初选通过
  INTERVIEW: 3, // 安排面试
  INTERVIEW_PASS: 4, // 面试通过
  OFFER_SENT: 5, // 已发 Offer
  PENDING_ENTRY: 6, // 待入职
  ELIMINATED: 7, // 已淘汰
  JOINED: 8, // 已入职
} as const;

/** 首页日历事项类型（对齐 Wukong NotesType） */
export const HrmHomeCalendarItemType = {
  NOTE: 1, // 备忘
  BIRTHDAY: 2, // 生日
  ENTRY: 3, // 入职
  REGULAR: 4, // 转正
  LEAVE: 5, // 离职
  RECRUIT: 6, // 招聘面试
  ATTENDANCE: 7, // 考勤打卡
} as const;

/** 团队工作台年龄区间类型（对齐后端 HrmHomeAgeRangeEnum） */
export const HrmTeamHomeAgeRangeType = {
  UNDER_18: 1, // 17 以下
  AGE_18_TO_25: 2, // 18 至 25
  AGE_26_TO_35: 3, // 26 至 35
  AGE_36_TO_45: 4, // 36 至 45
  AGE_46_TO_55: 5, // 46 至 55
  AGE_56_AND_ABOVE: 6, // 56 以上
} as const;

/** 团队工作台司龄区间类型（对齐后端 HrmHomeCompanyAgeRangeEnum） */
export const HrmTeamHomeCompanyAgeRangeType = {
  WITHIN_3_MONTHS: 1, // 3 个月内
  MONTHS_3_TO_6: 2, // 3 至 6 个月
  MONTHS_6_TO_1_YEAR: 3, // 6 个月至 1 年
  YEARS_1_TO_3: 4, // 1 至 3 年
  YEARS_3_TO_5: 5, // 3 至 5 年
  YEARS_5_TO_10: 6, // 5 至 10 年
  YEARS_10_AND_ABOVE: 7, // 10 年以上
} as const;

/** 员工状态页签枚举（对齐后端 HrmEmployeeStatusTabEnum） */
export const HrmEmployeeStatusTab = {
  ACTIVE: 11, // 在职
  FULL_TIME: 12, // 全职
  PENDING_ENTRY: 13, // 待入职
  PENDING_LEAVE: 14, // 待离职
  LEFT: 15, // 已离职
} as const;

/** 员工首页待办筛选类型（对齐后端 HrmEmployeeTodoTypeEnum） */
export const HrmEmployeeTodoType = {
  PENDING_LEAVE: 2, // 待离职
  CONTRACT_EXPIRE: 3, // 合同到期
  REGULAR: 4, // 待转正
  PENDING_ENTRY: 5, // 待入职
  BIRTHDAY: 6, // 生日
} as const;

/** 员工首页人事概况筛选类型（对齐后端 HrmEmployeeSurveyTypeEnum） */
export const HrmEmployeeSurveyType = {
  ENTRY: 1, // 入职
  LEAVE: 2, // 离职
  REGULAR: 3, // 转正
  TRANSFER: 4, // 调岗
  PENDING_ENTRY: 5, // 待入职
  PENDING_LEAVE: 6, // 待离职
} as const;

/** 员工首页人事概况筛选类型取值 */
export type HrmEmployeeSurveyTypeValue =
  (typeof HrmEmployeeSurveyType)[keyof typeof HrmEmployeeSurveyType];
