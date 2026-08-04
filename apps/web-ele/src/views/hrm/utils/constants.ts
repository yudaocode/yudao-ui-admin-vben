/** 薪资计税类型枚举（对齐后端 HrmSalaryTaxTypeEnum） */
export const HrmSalaryTaxType = {
  SALARY: 1, // 工资薪金所得税
  REMUNERATION: 2, // 劳务报酬所得税
  NONE: 3, // 不计税
} as const;

/** 薪资计税周期类型枚举（对齐后端 HrmSalaryTaxCycleTypeEnum） */
export const HrmSalaryTaxCycleType = {
  DECEMBER_TO_NOVEMBER: 1, // 上年 12 月至本年 11 月
  JANUARY_TO_DECEMBER: 2, // 本年 1 月至 12 月
} as const;

/** 薪资计税周期类型选项 */
export const HrmSalaryTaxCycleTypeOptions = [
  {
    label: '上年 12 月至今年 11 月（对应的工资发放方式为次月发上月工资）',
    value: HrmSalaryTaxCycleType.DECEMBER_TO_NOVEMBER,
  },
  {
    label: '今年 1 月至 12 月（对应的工资发放方式为当月发当月工资）',
    value: HrmSalaryTaxCycleType.JANUARY_TO_DECEMBER,
  },
] as const;

/** 薪资对应社保月份类型枚举（对齐后端 HrmSalarySocialSecurityMonthTypeEnum） */
export const HrmSalarySocialSecurityMonthType = {
  PREVIOUS_MONTH: 0, // 上月
  CURRENT_MONTH: 1, // 当月
  NEXT_MONTH: 2, // 次月
} as const;

/** 薪资对应社保月份类型选项 */
export const HrmSalarySocialSecurityMonthTypeOptions = [
  { label: '上月', value: HrmSalarySocialSecurityMonthType.PREVIOUS_MONTH },
  { label: '当月', value: HrmSalarySocialSecurityMonthType.CURRENT_MONTH },
  { label: '次月', value: HrmSalarySocialSecurityMonthType.NEXT_MONTH },
] as const;

/** 薪资项类型（对齐后端 HrmSalaryOptionTypeEnum） */
export const HrmSalaryOptionType = {
  MINUS: 0, // 减项
  ADD: 1, // 加项
  CALCULATED: 2, // 计算项
} as const;

/** 考勤节假日类型（对齐后端 HrmAttendanceHolidayTypeEnum） */
export const HrmAttendanceHolidayType = {
  WORK: 1, // 上班
  REST: 2, // 休息
} as const;

/** 考勤迟到早退扣款方式 */
export const HrmAttendanceLateEarlyDeductMethod = {
  FIXED_MONTH: 1,
  BY_MINUTE: 2,
  BY_COUNT: 3,
} as const;

/** 考勤旷工扣款方式 */
export const HrmAttendanceAbsenteeismDeductMethod = {
  BY_DAY: 1,
} as const;

/** 考勤缺卡扣款方式 */
export const HrmAttendanceMisscardDeductMethod = {
  BY_COUNT: 1,
} as const;

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

/** 新建员工支持的入职状态 */
export const HRM_EMPLOYEE_CREATE_ENTRY_STATUSES = [
  HrmEmployeeEntryStatus.ACTIVE,
  HrmEmployeeEntryStatus.PENDING_ENTRY,
] as const;

/** 非正式员工支持的员工状态 */
export const HRM_EMPLOYEE_NON_FORMAL_STATUSES = [
  HrmEmployeeStatus.INTERN,
  HrmEmployeeStatus.PART_TIME,
  HrmEmployeeStatus.LABOR,
  HrmEmployeeStatus.CONSULTANT,
  HrmEmployeeStatus.REHIRE,
  HrmEmployeeStatus.OUTSOURCE,
] as const;

/** 无试用期的月数 */
export const HRM_EMPLOYEE_NO_PROBATION_MONTHS = 0;

/** 员工异动类型枚举（对齐后端 HrmEmployeeChangeTypeEnum） */
export const HrmEmployeeChangeType = {
  REGULAR: 4,
  TRANSFER: 5,
  PROMOTION: 6,
  DEMOTION: 7,
  FULL_TIME: 8,
  REHIRE: 9,
} as const;

/** 员工异动类型选项 */
export const HrmEmployeeChangeTypeOptions = [
  { label: '办理转正', value: HrmEmployeeChangeType.REGULAR },
  { label: '调整部门/岗位', value: HrmEmployeeChangeType.TRANSFER },
  { label: '晋升', value: HrmEmployeeChangeType.PROMOTION },
  { label: '降级', value: HrmEmployeeChangeType.DEMOTION },
  { label: '转为全职', value: HrmEmployeeChangeType.FULL_TIME },
  { label: '再入职', value: HrmEmployeeChangeType.REHIRE },
] as const;

/** 员工异动原因枚举（对齐后端 HrmEmployeeChangeReasonEnum） */
export const HrmEmployeeChangeReason = {
  ORGANIZATION_ADJUSTMENT: 1,
  PERSONAL_APPLICATION: 2,
  WORK_ARRANGEMENT: 3,
  VIOLATION: 4,
  UNDERPERFORMANCE: 5,
  HEALTH_REASON: 6,
  UNSUITABLE_POSITION: 7,
} as const;

/** 员工异动原因选项 */
export const HrmEmployeeChangeReasonOptions = [
  {
    label: '组织架构调整',
    value: HrmEmployeeChangeReason.ORGANIZATION_ADJUSTMENT,
  },
  { label: '个人申请', value: HrmEmployeeChangeReason.PERSONAL_APPLICATION },
  { label: '工作安排', value: HrmEmployeeChangeReason.WORK_ARRANGEMENT },
  { label: '违规违纪', value: HrmEmployeeChangeReason.VIOLATION },
  { label: '绩效不达标', value: HrmEmployeeChangeReason.UNDERPERFORMANCE },
  { label: '个人身体原因', value: HrmEmployeeChangeReason.HEALTH_REASON },
  {
    label: '不适应当前岗位',
    value: HrmEmployeeChangeReason.UNSUITABLE_POSITION,
  },
] as const;

/** 员工离职类型枚举（对齐后端 HrmEmployeeQuitTypeEnum） */
export const HrmEmployeeQuitType = {
  VOLUNTARY: 1,
  INVOLUNTARY: 2,
  RETIREMENT: 3,
} as const;

/** 员工离职类型选项 */
export const HrmEmployeeQuitTypeOptions = [
  { label: '主动离职', value: HrmEmployeeQuitType.VOLUNTARY },
  { label: '被动离职', value: HrmEmployeeQuitType.INVOLUNTARY },
  { label: '退休', value: HrmEmployeeQuitType.RETIREMENT },
] as const;

/** 员工离职原因枚举（对齐后端 HrmEmployeeQuitReasonEnum） */
export const HrmEmployeeQuitReason = {
  FAMILY: 1,
  HEALTH: 2,
  SALARY: 3,
  INCONVENIENT_TRAFFIC: 4,
  WORK_PRESSURE: 5,
  MANAGEMENT_ISSUE: 6,
  NO_PROMOTION_OPPORTUNITY: 7,
  CAREER_PLANNING: 8,
  GIVE_UP_RENEWAL: 9,
  OTHER_PERSONAL_REASON: 10,
  TRIAL_PERIOD_DISMISSAL: 11,
  VIOLATION: 12,
  LAYOFF: 13,
  UNDERPERFORMANCE: 14,
  CONTRACT_NOT_RENEWED: 15,
  OTHER_INVOLUNTARY_REASON: 16,
} as const;

/** 员工离职原因选项 */
export const HrmEmployeeQuitReasonOptions = [
  {
    label: '家庭原因',
    value: HrmEmployeeQuitReason.FAMILY,
    quitType: HrmEmployeeQuitType.VOLUNTARY,
  },
  {
    label: '身体原因',
    value: HrmEmployeeQuitReason.HEALTH,
    quitType: HrmEmployeeQuitType.VOLUNTARY,
  },
  {
    label: '薪资原因',
    value: HrmEmployeeQuitReason.SALARY,
    quitType: HrmEmployeeQuitType.VOLUNTARY,
  },
  {
    label: '交通不便',
    value: HrmEmployeeQuitReason.INCONVENIENT_TRAFFIC,
    quitType: HrmEmployeeQuitType.VOLUNTARY,
  },
  {
    label: '工作压力',
    value: HrmEmployeeQuitReason.WORK_PRESSURE,
    quitType: HrmEmployeeQuitType.VOLUNTARY,
  },
  {
    label: '管理问题',
    value: HrmEmployeeQuitReason.MANAGEMENT_ISSUE,
    quitType: HrmEmployeeQuitType.VOLUNTARY,
  },
  {
    label: '无晋升机会',
    value: HrmEmployeeQuitReason.NO_PROMOTION_OPPORTUNITY,
    quitType: HrmEmployeeQuitType.VOLUNTARY,
  },
  {
    label: '职业规划',
    value: HrmEmployeeQuitReason.CAREER_PLANNING,
    quitType: HrmEmployeeQuitType.VOLUNTARY,
  },
  {
    label: '合同到期放弃续签',
    value: HrmEmployeeQuitReason.GIVE_UP_RENEWAL,
    quitType: HrmEmployeeQuitType.VOLUNTARY,
  },
  {
    label: '其他个人原因',
    value: HrmEmployeeQuitReason.OTHER_PERSONAL_REASON,
    quitType: HrmEmployeeQuitType.VOLUNTARY,
  },
  {
    label: '试用期内辞退',
    value: HrmEmployeeQuitReason.TRIAL_PERIOD_DISMISSAL,
    quitType: HrmEmployeeQuitType.INVOLUNTARY,
  },
  {
    label: '违反公司条例',
    value: HrmEmployeeQuitReason.VIOLATION,
    quitType: HrmEmployeeQuitType.INVOLUNTARY,
  },
  {
    label: '组织调整/裁员',
    value: HrmEmployeeQuitReason.LAYOFF,
    quitType: HrmEmployeeQuitType.INVOLUNTARY,
  },
  {
    label: '绩效不达标辞退',
    value: HrmEmployeeQuitReason.UNDERPERFORMANCE,
    quitType: HrmEmployeeQuitType.INVOLUNTARY,
  },
  {
    label: '合同到期不续签',
    value: HrmEmployeeQuitReason.CONTRACT_NOT_RENEWED,
    quitType: HrmEmployeeQuitType.INVOLUNTARY,
  },
  {
    label: '其他原因',
    value: HrmEmployeeQuitReason.OTHER_INVOLUNTARY_REASON,
    quitType: HrmEmployeeQuitType.INVOLUNTARY,
  },
] as const;

/** 员工证件类型枚举 */
export const HrmEmployeeIdType = {
  ID_CARD: 1,
  HONG_KONG_MACAO_PASS: 2,
  TAIWAN_PASS: 3,
  PASSPORT: 4,
  OTHER: 5,
} as const;

/** 员工证件类型选项 */
export const HrmEmployeeIdTypeOptions = [
  { label: '身份证', value: HrmEmployeeIdType.ID_CARD },
  { label: '港澳通行证', value: HrmEmployeeIdType.HONG_KONG_MACAO_PASS },
  { label: '台湾通行证', value: HrmEmployeeIdType.TAIWAN_PASS },
  { label: '护照', value: HrmEmployeeIdType.PASSPORT },
  { label: '其他', value: HrmEmployeeIdType.OTHER },
] as const;

/** 员工教育经历教学方式枚举 */
export const HrmEmployeeTeachingMethod = {
  FULL_TIME: 1,
  ADULT_EDUCATION: 2,
  DISTANCE_EDUCATION: 3,
  SELF_STUDY_EXAMINATION: 4,
  OTHER: 5,
} as const;

/** 员工教育经历教学方式选项 */
export const HrmEmployeeTeachingMethodOptions = [
  { label: '全日制', value: HrmEmployeeTeachingMethod.FULL_TIME },
  { label: '成人教育', value: HrmEmployeeTeachingMethod.ADULT_EDUCATION },
  { label: '远程教育', value: HrmEmployeeTeachingMethod.DISTANCE_EDUCATION },
  {
    label: '自学考试',
    value: HrmEmployeeTeachingMethod.SELF_STUDY_EXAMINATION,
  },
  { label: '其他', value: HrmEmployeeTeachingMethod.OTHER },
] as const;

/** 员工合同类型枚举 */
export const HrmEmployeeContractType = {
  FIXED_TERM_LABOR_CONTRACT: 1,
  NON_FIXED_TERM_LABOR_CONTRACT: 2,
  WORK_TASK_LABOR_CONTRACT: 3,
  INTERNSHIP_AGREEMENT: 4,
  LABOR_SERVICE_CONTRACT: 5,
  REEMPLOYMENT_AGREEMENT: 6,
  LABOR_DISPATCH_CONTRACT: 7,
  SECONDMENT_CONTRACT: 8,
  OTHER: 9,
} as const;

/** 员工合同类型选项 */
export const HrmEmployeeContractTypeOptions = [
  {
    label: '固定期限劳动合同',
    value: HrmEmployeeContractType.FIXED_TERM_LABOR_CONTRACT,
  },
  {
    label: '无固定期限劳动合同',
    value: HrmEmployeeContractType.NON_FIXED_TERM_LABOR_CONTRACT,
  },
  {
    label: '以完成一定工作任务为期限的劳动合同',
    value: HrmEmployeeContractType.WORK_TASK_LABOR_CONTRACT,
  },
  { label: '实习协议', value: HrmEmployeeContractType.INTERNSHIP_AGREEMENT },
  { label: '劳务合同', value: HrmEmployeeContractType.LABOR_SERVICE_CONTRACT },
  { label: '返聘协议', value: HrmEmployeeContractType.REEMPLOYMENT_AGREEMENT },
  {
    label: '劳务派遣合同',
    value: HrmEmployeeContractType.LABOR_DISPATCH_CONTRACT,
  },
  { label: '借调合同', value: HrmEmployeeContractType.SECONDMENT_CONTRACT },
  { label: '其他', value: HrmEmployeeContractType.OTHER },
] as const;

/** 员工合同期限选项 */
export const HrmEmployeeContractTermOptions = Array.from(
  { length: 10 },
  (_, index) => ({
    label: `${index + 1} 年`,
    value: index + 1,
  }),
);

/** 员工合同状态枚举 */
export const HrmEmployeeContractStatus = {
  NOT_PERFORMED: 0,
  IN_PROGRESS: 1,
  EXPIRED: 2,
} as const;

/** 员工合同状态选项 */
export const HrmEmployeeContractStatusOptions = [
  { label: '未执行', value: HrmEmployeeContractStatus.NOT_PERFORMED },
  { label: '执行中', value: HrmEmployeeContractStatus.IN_PROGRESS },
  { label: '已到期', value: HrmEmployeeContractStatus.EXPIRED },
] as const;

/** 员工材料附件类型枚举 */
export const HrmEmployeeFileType = {
  ID_CARD_ORIGINAL: 11,
  EDUCATION_CERTIFICATE: 12,
  PROFILE_PHOTO: 13,
  ID_CARD_COPY: 14,
  SALARY_BANK_CARD: 15,
  SOCIAL_SECURITY_CARD: 16,
  HOUSING_FUND_CARD: 17,
  AWARD_CERTIFICATE: 18,
  BASIC_OTHER: 19,
  LABOR_CONTRACT: 21,
  ENTRY_RESUME: 22,
  ENTRY_REGISTRATION: 23,
  ENTRY_MEDICAL_REPORT: 24,
  PREVIOUS_LEAVE_CERTIFICATE: 25,
  REGULAR_APPLICATION: 26,
  ARCHIVE_OTHER: 27,
  LEAVE_APPROVAL: 31,
  LEAVE_CERTIFICATE: 32,
  LEAVE_OTHER: 33,
} as const;

/** 工资表状态（对齐后端 HrmSalaryConstants） */
export const HrmSalaryMonthStatus = {
  UNCOMPUTED: 5, // 未核算
  HISTORY: 10, // 已归档
  COMPUTED: 11, // 已核算
} as const;

/** 工资表员工异动分类（对齐后端 HrmSalaryEmployeeChangeTypeEnum） */
export const HrmSalaryEmployeeChangeType = {
  ALL: 0, // 计薪人数
  ENTRY: 1, // 新入职
  LEAVE: 2, // 离职
  REGULAR: 3, // 转正
  TRANSFER: 4, // 调岗
} as const;

/** 预置薪资项编码（对齐后端 HrmSalaryOptionCodeEnum） */
export const HrmSalaryOptionCode = {
  PERSONAL_INSURANCE: 100_101,
  PERSONAL_PROVIDENT_FUND: 100_102,
  CORPORATE_INSURANCE: 110_101,
  CORPORATE_PROVIDENT_FUND: 120_101,
  EXPECTED_PAY: 210_101,
  TAXABLE: 220_101,
  PERSONAL_TAX: 230_101,
  REAL_PAY: 240_101,
} as const;

/** 薪资项分类编码 */
export const HrmSalaryOptionCategoryCode = {
  ROOT: 0,
  BASIC_SALARY: 10,
} as const;

/** 工资表系统计算项编码 */
export const HRM_SALARY_COMPUTED_OPTION_CODES = new Set<number>([
  HrmSalaryOptionCode.EXPECTED_PAY,
  HrmSalaryOptionCode.PERSONAL_TAX,
  HrmSalaryOptionCode.REAL_PAY,
  HrmSalaryOptionCode.TAXABLE,
]);

/** 工资条模板明细类型（对齐后端 HrmSalarySlipTemplateOptionTypeEnum） */
export const HrmSalarySlipTemplateOptionType = {
  CATEGORY: 1,
  ITEM: 2,
} as const;

/** 薪资调整记录类型 */
export const HrmSalaryRecordType = {
  FIXED: 1, // 定薪
  CHANGE: 2, // 调薪
} as const;

/** 定薪调薪原因（对齐后端 HrmSalaryChangeReasonEnum） */
export const HrmSalaryChangeReason = {
  ENTRY_SALARY: 0, // 入职定薪
  ENTRY_CONFIRM: 1, // 入职核定
  REGULAR: 2, // 转正
  PROMOTION: 3, // 晋升
  TRANSFER: 4, // 调动
  MID_YEAR_ADJUSTMENT: 5, // 年中调薪
  ANNUAL_ADJUSTMENT: 6, // 年度调薪
  SPECIAL_ADJUSTMENT: 7, // 特别调薪
  OTHER: 8, // 其他
} as const;

/** 批量调薪方式（对齐后端 HrmSalaryBatchAdjustTypeEnum） */
export const HrmSalaryBatchAdjustType = {
  PERCENT: 1, // 按比例
  AMOUNT: 2, // 按金额
} as const;

/** 薪资调整记录状态 */
export const HrmSalaryChangeRecordStatus = {
  PENDING: 0, // 待生效
  EFFECTIVE: 1, // 已生效
  CANCELLED: 2, // 已取消
} as const;

/** 月度社保表状态 */
export const HrmInsuranceMonthStatus = {
  UNARCHIVED: 0, // 未归档
  ARCHIVED: 1, // 已归档
} as const;

/** 社保方案类型 */
export const HrmInsuranceSchemeType = {
  PROPORTION: 1, // 比例
  AMOUNT: 2, // 固定金额
} as const;

/** 社保项目类型 */
export const HrmInsuranceProjectType = {
  ENDOWMENT: 1, // 养老保险
  MEDICAL: 2, // 医疗保险
  UNEMPLOYMENT: 3, // 失业保险
  EMPLOYMENT_INJURY: 4, // 工伤保险
  MATERNITY: 5, // 生育保险
  SUPPLEMENTARY_MEDICAL: 6, // 补充大病医疗
  SUPPLEMENTARY_ENDOWMENT: 7, // 补充养老
  DISABILITY: 8, // 残保金
  CUSTOM_SOCIAL_SECURITY: 9, // 社保自定义
  PROVIDENT_FUND: 10, // 公积金
  CUSTOM_PROVIDENT_FUND: 11, // 公积金自定义
} as const;

/** 员工月度参保状态 */
export const HrmInsuranceEmployeeStatus = {
  STOPPED: 0, // 停止参保
  NORMAL: 1, // 正常参保
} as const;

/** 员工材料附件分组 */
export const HrmEmployeeFileGroups = [
  {
    label: '员工基本资料',
    options: [
      { label: '身份证原件照片', value: HrmEmployeeFileType.ID_CARD_ORIGINAL },
      {
        label: '学历证明',
        value: HrmEmployeeFileType.EDUCATION_CERTIFICATE,
      },
      { label: '个人证件照', value: HrmEmployeeFileType.PROFILE_PHOTO },
      { label: '身份证复印件', value: HrmEmployeeFileType.ID_CARD_COPY },
      { label: '工资银行卡', value: HrmEmployeeFileType.SALARY_BANK_CARD },
      { label: '社保卡', value: HrmEmployeeFileType.SOCIAL_SECURITY_CARD },
      { label: '公积金卡', value: HrmEmployeeFileType.HOUSING_FUND_CARD },
      { label: '获奖证书', value: HrmEmployeeFileType.AWARD_CERTIFICATE },
      { label: '其他', value: HrmEmployeeFileType.BASIC_OTHER },
    ],
  },
  {
    label: '员工档案资料',
    options: [
      { label: '劳动合同', value: HrmEmployeeFileType.LABOR_CONTRACT },
      { label: '入职简历', value: HrmEmployeeFileType.ENTRY_RESUME },
      { label: '入职登记表', value: HrmEmployeeFileType.ENTRY_REGISTRATION },
      { label: '入职体检单', value: HrmEmployeeFileType.ENTRY_MEDICAL_REPORT },
      {
        label: '上家公司离职证明',
        value: HrmEmployeeFileType.PREVIOUS_LEAVE_CERTIFICATE,
      },
      { label: '转正申请表', value: HrmEmployeeFileType.REGULAR_APPLICATION },
      { label: '其他', value: HrmEmployeeFileType.ARCHIVE_OTHER },
    ],
  },
  {
    label: '员工离职资料',
    options: [
      { label: '离职审批', value: HrmEmployeeFileType.LEAVE_APPROVAL },
      { label: '离职证明', value: HrmEmployeeFileType.LEAVE_CERTIFICATE },
      { label: '其他', value: HrmEmployeeFileType.LEAVE_OTHER },
    ],
  },
] as const;

/** 招聘职位状态枚举（对齐后端 HrmRecruitPostStatusEnum） */
export const HrmRecruitPostStatus = {
  STOPPED: 0, // 停止招聘
  RECRUITING: 1, // 招聘中
} as const;

/** 招聘职位状态取值 */
export type HrmRecruitPostStatusValue =
  (typeof HrmRecruitPostStatus)[keyof typeof HrmRecruitPostStatus];

/** 招聘工作性质枚举（对齐 hrm_recruit_job_nature 字典） */
export const HrmRecruitJobNature = {
  FULL_TIME: 1, // 全职
  INTERNSHIP: 2, // 实习
  PART_TIME: 3, // 兼职
} as const;

/** 招聘工作经验枚举（对齐 hrm_recruit_work_time 字典） */
export const HrmRecruitWorkTime = {
  UNLIMITED: 1, // 不限
  LESS_THAN_ONE_YEAR: 2, // 1 年以下
  ONE_TO_THREE_YEARS: 3, // 1-3 年
  THREE_TO_FIVE_YEARS: 4, // 3-5 年
  FIVE_TO_TEN_YEARS: 5, // 5-10 年
  MORE_THAN_TEN_YEARS: 6, // 10 年以上
} as const;

/** 招聘职位学历要求枚举（对齐 hrm_recruit_post_education 字典） */
export const HrmRecruitPostEducation = {
  UNLIMITED: 1, // 不限
  HIGH_SCHOOL_AND_ABOVE: 2, // 高中及以上
  COLLEGE_AND_ABOVE: 3, // 大专及以上
  BACHELOR_AND_ABOVE: 4, // 本科及以上
  MASTER_AND_ABOVE: 5, // 硕士及以上
  DOCTOR: 6, // 博士
} as const;

/** 招聘薪资单位枚举（对齐 hrm_recruit_salary_unit 字典） */
export const HrmRecruitSalaryUnit = {
  MONTH: 1, // 元/月
  YEAR: 2, // 元/年
} as const;

/** 招聘紧急程度枚举（对齐 hrm_recruit_emergency_level 字典） */
export const HrmRecruitEmergencyLevel = {
  URGENT: 1, // 紧急
  NORMAL: 2, // 一般
} as const;

/** 薪资面议值（对齐后端 HrmRecruitPostDO.SALARY_NEGOTIABLE_VALUE） */
export const SALARY_NEGOTIABLE_VALUE = -1;

/** 薪资面议单位值（对齐后端 HrmRecruitPostDO.SALARY_NEGOTIABLE_UNIT_VALUE） */
export const SALARY_NEGOTIABLE_UNIT_VALUE = -1;

/** 年龄不限值（对齐后端 HrmRecruitPostDO.AGE_UNLIMITED_VALUE） */
export const AGE_UNLIMITED_VALUE = -1;

/** 考勤打卡来源（对齐后端 HrmAttendanceClockSourceEnum） */
export const HrmAttendanceClockSource = {
  MOBILE: 1, // 手机端
  MANUAL: 2, // 手工录入
} as const;

/** 考勤打卡类型（对齐后端 HrmAttendanceClockTypeEnum） */
export const HrmAttendanceClockType = {
  ON_DUTY: 1, // 上班打卡
  OFF_DUTY: 2, // 下班打卡
} as const;

/** 考勤地点有效打卡半径（米） */
export const HRM_ATTENDANCE_POINT_RADIUS_OPTIONS = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000,
] as const;

/** 星期选项 */
export const HRM_WEEK_OPTIONS = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
] as const;

/** 绩效计划状态（对齐后端 HrmPerformancePlanStatusEnum） */
export const HrmPerformancePlanStatus = {
  DRAFT: 1,
  NOT_STARTED: 2,
  RUNNING: 3,
  ARCHIVED: 4,
  TERMINATED: 5,
} as const;

/** 绩效申诉超期处理动作 */
export const HrmPerformanceAppealTimeoutAction = {
  REJECT: 1,
  APPROVE: 2,
} as const;

/** 绩效考核周期类型 */
export const HrmPerformanceCycleType = {
  MONTH: 1,
  QUARTER: 2,
  FIRST_HALF_YEAR: 3,
  SECOND_HALF_YEAR: 4,
  YEAR: 5,
  OTHER: 6,
} as const;

export const HrmPerformanceCycleTypeOptions = [
  { label: '月度', value: HrmPerformanceCycleType.MONTH },
  { label: '季度', value: HrmPerformanceCycleType.QUARTER },
  { label: '上半年', value: HrmPerformanceCycleType.FIRST_HALF_YEAR },
  { label: '下半年', value: HrmPerformanceCycleType.SECOND_HALF_YEAR },
  { label: '全年', value: HrmPerformanceCycleType.YEAR },
  { label: '其他', value: HrmPerformanceCycleType.OTHER },
] as const;

/** 绩效考核范围类型 */
export const HrmPerformancePlanScopeType = {
  EMPLOYEE_DEPT: 1,
  EMPLOYMENT: 2,
} as const;

/** 绩效指标制定类型 */
export const HrmPerformanceQuotaSettingType = {
  SYSTEM: 1,
  EMPLOYEE: 2,
} as const;

/** 绩效总分计算方式 */
export const HrmPerformanceScoreCalculation = {
  WEIGHTED: 1,
} as const;

/** 绩效评分上限类型 */
export const HrmPerformanceUpperLimitType = {
  UNIFIED: 1,
} as const;

/** 绩效评分人类型 */
export const HrmPerformanceRaterType = {
  SUPERIOR: 1,
  DEPT_LEADER: 2,
  SPECIFIED: 3,
  SELF: 4,
} as const;

export const HrmPerformanceHandlerTypeOptions = [
  { label: '上级', value: HrmPerformanceRaterType.SUPERIOR },
  { label: '部门负责人', value: HrmPerformanceRaterType.DEPT_LEADER },
  { label: '指定员工', value: HrmPerformanceRaterType.SPECIFIED },
] as const;

export const HrmPerformanceRaterTypeOptions = [
  ...HrmPerformanceHandlerTypeOptions,
  { label: '被考核人', value: HrmPerformanceRaterType.SELF },
] as const;

export const HRM_PERFORMANCE_RATER_MAX_LEVEL = 10;

/** 绩效评分方式 */
export const HrmPerformanceReviewScoringType = {
  QUOTA: 1,
  TOTAL: 2,
} as const;

/** 绩效评分内容可见范围 */
export const HrmPerformanceReviewVisibleContent = {
  SELF: 1,
  ALL: 2,
} as const;

/** 绩效指标类型 */
export const HrmPerformanceQuotaType = {
  PERFORMANCE: 1,
  BEHAVIOR: 2,
} as const;

export const HrmPerformanceQuotaScoreType = {
  DIRECT_INPUT: 1,
} as const;

/** 员工绩效考核阶段状态 */
export const HrmPerformanceAssessmentStageStatus = {
  NOT_PROCESSED: 0,
  PROCESSED: 1,
  PENDING: 2,
  REJECTED: 3,
  PROCESSING: 4,
  APPEALED: 5,
} as const;

/** 绩效业务阶段类型 */
export const HrmPerformanceStageType = {
  NOT_STARTED: 0,
  FILL_QUOTA: 1,
  TARGET_CONFIRM: 2,
  SELF_SCORE: 3,
  OTHER_SCORE: 4,
  RESULT_AUDIT: 5,
  RESULT_CONFIRM: 6,
  APPEAL_CONFIRM: 7,
  ARCHIVED: 8,
  EXECUTING: 9,
  END: 10,
} as const;

/** 绩效申诉状态 */
export const HrmPerformanceAppealStatus = {
  NONE: 0,
  PENDING: 1,
  PASS: 2,
  REJECT: 3,
  CANCEL: 4,
} as const;

/** 绩效确认结果 */
export const HrmPerformanceConfirmationResult = {
  REJECT: 0,
  PASS: 1,
} as const;

/** 工资条排序字段类型 */
export const HrmSalarySlipOrderType = {
  SEND_TIME: 1,
  REAL_PAY_SALARY: 2,
} as const;

/** 工资条排序方向 */
export const HrmSalarySlipOrder = {
  DESC: 1,
  ASC: 2,
} as const;

/** 工资条排序选项 */
export const HrmSalarySlipSort = {
  RECENT_SEND: 1,
  EARLIEST_SEND: 2,
  REAL_PAY_ASC: 3,
  REAL_PAY_DESC: 4,
} as const;

/** 工资条排序选项及其接口参数 */
export const HRM_SALARY_SLIP_SORT_OPTIONS = [
  {
    label: '按最近发放',
    value: HrmSalarySlipSort.RECENT_SEND,
    orderType: HrmSalarySlipOrderType.SEND_TIME,
    order: HrmSalarySlipOrder.DESC,
  },
  {
    label: '按最早发放',
    value: HrmSalarySlipSort.EARLIEST_SEND,
    orderType: HrmSalarySlipOrderType.SEND_TIME,
    order: HrmSalarySlipOrder.ASC,
  },
  {
    label: '按实发工资升序',
    value: HrmSalarySlipSort.REAL_PAY_ASC,
    orderType: HrmSalarySlipOrderType.REAL_PAY_SALARY,
    order: HrmSalarySlipOrder.ASC,
  },
  {
    label: '按实发工资降序',
    value: HrmSalarySlipSort.REAL_PAY_DESC,
    orderType: HrmSalarySlipOrderType.REAL_PAY_SALARY,
    order: HrmSalarySlipOrder.DESC,
  },
] as const;
