/** HRM 业务类型枚举 */
export const HrmBizType = {
  RECRUIT_POST: 1, // 招聘职位
  RECRUIT_CANDIDATE: 2, // 招聘候选人
  EMPLOYEE: 3, // 员工档案
  PERFORMANCE_ASSESSMENT: 4, // 绩效考核
  PERFORMANCE_PLAN: 5, // 绩效计划
} as const;

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

/** 招聘候选人状态取值 */
export type HrmRecruitCandidateStatusValue =
  (typeof HrmRecruitCandidateStatus)[keyof typeof HrmRecruitCandidateStatus];

/** 招聘候选人学历枚举（对齐 hrm_recruit_candidate_education 字典） */
export const HrmRecruitCandidateEducation = {
  PRIMARY_SCHOOL: 1, // 小学
  JUNIOR_HIGH_SCHOOL: 2, // 初中
  HIGH_SCHOOL: 3, // 高中
  COLLEGE: 4, // 大专
  BACHELOR: 5, // 本科
  MASTER: 6, // 硕士
  DOCTOR: 7, // 博士
} as const;

/** 招聘面试方式枚举（对齐后端字典 hrm_recruit_interview_type） */
export const HrmRecruitInterviewType = {
  ONSITE: 1, // 现场面试
  PHONE: 2, // 电话面试
  VIDEO: 3, // 视频面试
} as const;

/** 招聘面试结果枚举（对齐后端 HrmRecruitInterviewResultEnum） */
export const HrmRecruitInterviewResult = {
  UNFINISHED: 1, // 未完成
  PASS: 2, // 通过
  NOT_PASS: 3, // 未通过
  CANCELED: 4, // 取消
} as const;

/** 员工入职状态枚举（对齐后端 HrmEmployeeEntryStatusEnum） */
export const HrmEmployeeEntryStatus = {
  ACTIVE: 1, // 在职
  PENDING_ENTRY: 2, // 待入职
  PENDING_LEAVE: 3, // 待离职
  LEFT: 4, // 离职
} as const;

/** 员工状态枚举（对齐后端 HrmEmployeeStatusEnum） */
export const HrmEmployeeStatus = {
  REGULAR: 1, // 正式
  PROBATION: 2, // 试用
  INTERN: 3, // 实习
  PART_TIME: 4, // 兼职
  LABOR: 5, // 劳务
  CONSULTANT: 6, // 顾问
  REHIRE: 7, // 返聘
  OUTSOURCE: 8, // 外包
} as const;

/** 员工聘用形式枚举（对齐后端 HrmEmployeeTypeEnum） */
export const HrmEmployeeType = {
  FORMAL: 1, // 正式
  INFORMAL: 2, // 非正式
} as const;

/** 员工最高学历枚举（对齐 hrm_employee_education 字典） */
export const HrmEmployeeEducation = {
  PRIMARY_SCHOOL: 1, // 小学
  JUNIOR_HIGH_SCHOOL: 2, // 初中
  TECHNICAL_SECONDARY_SCHOOL: 3, // 中专
  SECONDARY_VOCATIONAL_SCHOOL: 4, // 中职
  TECHNICAL_SCHOOL: 5, // 技校
  HIGH_SCHOOL: 6, // 高中
  COLLEGE: 7, // 大专
  BACHELOR: 8, // 本科
  MASTER: 9, // 硕士
  DOCTOR: 10, // 博士
  POSTDOCTORAL: 11, // 博士后
  OTHER: 12, // 其他
} as const;

/** 候选人学历转员工最高学历，避免两套字典同值不同义 */
export const HRM_RECRUIT_CANDIDATE_EMPLOYEE_EDUCATION_MAP: Readonly<
  Record<number, number>
> = {
  [HrmRecruitCandidateEducation.PRIMARY_SCHOOL]:
    HrmEmployeeEducation.PRIMARY_SCHOOL,
  [HrmRecruitCandidateEducation.JUNIOR_HIGH_SCHOOL]:
    HrmEmployeeEducation.JUNIOR_HIGH_SCHOOL,
  [HrmRecruitCandidateEducation.HIGH_SCHOOL]: HrmEmployeeEducation.HIGH_SCHOOL,
  [HrmRecruitCandidateEducation.COLLEGE]: HrmEmployeeEducation.COLLEGE,
  [HrmRecruitCandidateEducation.BACHELOR]: HrmEmployeeEducation.BACHELOR,
  [HrmRecruitCandidateEducation.MASTER]: HrmEmployeeEducation.MASTER,
  [HrmRecruitCandidateEducation.DOCTOR]: HrmEmployeeEducation.DOCTOR,
};

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
