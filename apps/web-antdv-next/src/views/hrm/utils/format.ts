import type { HrmAttendanceGroupApi } from '#/api/hrm/attendance/group';
import type { HrmInsuranceSchemeApi } from '#/api/hrm/insurance/scheme';
import type { HrmRecruitPostApi } from '#/api/hrm/recruit/post';
import type { HrmSalaryGroupApi } from '#/api/hrm/salary/config/group';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { formatDate, formatDateTime } from '@vben/utils';

import dayjs from 'dayjs';
import { SolarDay } from 'tyme4ts';

import {
  AGE_UNLIMITED_VALUE,
  HRM_WEEK_OPTIONS,
  HrmAttendanceHolidayType,
  HrmAttendanceLateEarlyDeductMethod,
  HrmEmployeeChangeTypeOptions,
  HrmEmployeeContractStatusOptions,
  HrmEmployeeContractTypeOptions,
  HrmEmployeeIdTypeOptions,
  HrmEmployeeQuitReasonOptions,
  HrmEmployeeQuitTypeOptions,
  HrmEmployeeTeachingMethodOptions,
  HrmInsuranceProjectType,
  SALARY_NEGOTIABLE_VALUE,
} from '#/views/hrm/utils/constants';

/** 格式化薪资组适用范围 */
export function formatSalaryGroupScope(
  salaryGroup: HrmSalaryGroupApi.SalaryGroup,
): string {
  return (
    [
      ...(salaryGroup.deptNames || []),
      ...(salaryGroup.employeeNames || []),
    ].join('、') || '-'
  );
}

/** 格式化考勤星期 */
export function formatHrmAttendanceWeeks(weeks?: number[]): string {
  return (
    weeks
      ?.map(
        (week) => HRM_WEEK_OPTIONS.find((item) => item.value === week)?.label,
      )
      .filter(Boolean)
      .join('、') || '-'
  );
}

/** 格式化考勤特殊日期 */
export function formatHrmAttendanceSpecialDate(
  specialDate: HrmAttendanceGroupApi.SpecialDate,
  shifts?: HrmAttendanceGroupApi.Shift[],
): string {
  if (specialDate.type === HrmAttendanceHolidayType.REST) {
    return '休息';
  }
  const week = specialDate.date
    ? dayjs(specialDate.date).day() || 7
    : undefined;
  const shift =
    shifts?.find((item) => week && item.weeks?.includes(week)) || shifts?.[0];
  return shift ? `${shift.startTime} - ${shift.endTime}` : '上班';
}

/** 格式化迟到早退扣款单位 */
export function formatHrmAttendanceDeductUnit(method: number): string {
  if (method === HrmAttendanceLateEarlyDeductMethod.BY_MINUTE) {
    return '分钟';
  }
  if (method === HrmAttendanceLateEarlyDeductMethod.BY_COUNT) {
    return '次';
  }
  return '月';
}

/** 格式化考勤班次工作时长 */
export function formatHrmAttendanceShiftDuration(
  shift: HrmAttendanceGroupApi.Shift,
): string {
  let duration = getTimeRangeMinutes(shift.startTime, shift.endTime);
  if (shift.excludeRestTime) {
    duration -= getTimeRangeMinutes(shift.restStartTime, shift.restEndTime);
  }
  duration = Math.max(duration, 0);
  return `${Math.floor(duration / 60)} 小时 ${duration % 60} 分钟`;
}

function getTimeRangeMinutes(startTime?: string, endTime?: string): number {
  if (!startTime || !endTime) {
    return 0;
  }
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const start = (startHour || 0) * 60 + (startMinute || 0);
  let end = (endHour || 0) * 60 + (endMinute || 0);
  if (end <= start) {
    end += 24 * 60;
  }
  return end - start;
}

/** 格式化 HRM 金额 */
export function formatHrmMoney(value?: null | number): string {
  return Number(value || 0).toFixed(2);
}

/** 格式化 HRM 比例 */
export function formatHrmRate(value?: null | number): string {
  return value === undefined || value === null
    ? '-'
    : `${Number(value).toFixed(2)}%`;
}

/** 格式化 HRM 参保项目名称 */
export function formatHrmInsuranceProjectName(
  project: HrmInsuranceSchemeApi.Project,
): string {
  if (
    project.type === HrmInsuranceProjectType.CUSTOM_SOCIAL_SECURITY ||
    project.type === HrmInsuranceProjectType.CUSTOM_PROVIDENT_FUND
  ) {
    return project.name || '-';
  }
  return (
    getDictLabel(DICT_TYPE.HRM_INSURANCE_PROJECT_TYPE, project.type) || '-'
  );
}

/** 格式化 HRM 绩效分数 */
export function formatHrmScore(value?: null | number): string {
  return value === undefined || value === null ? '-' : Number(value).toFixed(2);
}

/** 格式化 HRM 天数 */
export function formatHrmDays(value?: null | number): string {
  return Number(value || 0)
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1');
}

/** 格式化 HRM 日期时间 */
export function formatHrmDateTime(
  value?: Date | null | number | string,
): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(formatDateTime(value));
}

/** 格式化 HRM 日期 */
export function formatHrmDate(value?: Date | null | number | string): string {
  return formatHrmDateTime(value);
}

/** 格式化 HRM 日期范围 */
export function formatHrmDateRange(
  startTime?: null | number | string,
  endTime?: null | number | string,
): string {
  if (!startTime && !endTime) {
    return '-';
  }
  const start = startTime ? formatDate(startTime, 'YYYY-MM-DD') : '-';
  const end = endTime ? formatDate(endTime, 'YYYY-MM-DD') : '-';
  return `${start} ~ ${end}`;
}

/** 格式化 HRM 年月 */
export function formatHrmYearMonth(
  year?: null | number,
  month?: null | number,
): string {
  if (
    year === undefined ||
    year === null ||
    month === undefined ||
    month === null
  ) {
    return '-';
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** 格式化 HRM 月份 */
export function formatHrmMonth(value?: Date | null | number | string): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const text = String(formatDateTime(value));
  return text.length >= 7 ? text.slice(0, 7) : text;
}

/** 格式化 HRM 是否 */
export function formatHrmYesNo(value?: boolean | null): string {
  if (value === undefined || value === null) {
    return '-';
  }
  return value ? '是' : '否';
}

/** 格式化员工证件类型 */
export function formatHrmEmployeeIdType(value?: null | number): string {
  return (
    HrmEmployeeIdTypeOptions.find((item) => item.value === value)?.label || '-'
  );
}

/** 格式化员工异动类型 */
export function formatHrmEmployeeChangeType(value?: null | number): string {
  return (
    HrmEmployeeChangeTypeOptions.find((item) => item.value === value)?.label ||
    '-'
  );
}

/** 格式化员工离职类型 */
export function formatHrmEmployeeQuitType(value?: null | number): string {
  return (
    HrmEmployeeQuitTypeOptions.find((item) => item.value === value)?.label ||
    '-'
  );
}

/** 格式化员工离职原因 */
export function formatHrmEmployeeQuitReason(value?: null | number): string {
  return (
    HrmEmployeeQuitReasonOptions.find((item) => item.value === value)?.label ||
    '-'
  );
}

/** 格式化员工合同类型 */
export function formatHrmEmployeeContractType(value?: null | number): string {
  return (
    HrmEmployeeContractTypeOptions.find((item) => item.value === value)
      ?.label || '-'
  );
}

/** 格式化员工合同状态 */
export function formatHrmEmployeeContractStatus(value?: null | number): string {
  return (
    HrmEmployeeContractStatusOptions.find((item) => item.value === value)
      ?.label || '-'
  );
}

/** 格式化员工教学方式 */
export function formatHrmEmployeeTeachingMethod(value?: null | number): string {
  return (
    HrmEmployeeTeachingMethodOptions.find((item) => item.value === value)
      ?.label || '-'
  );
}

/** 格式化带千分位的 HRM 金额 */
export function formatHrmMoneyWithThousands(value?: null | number): string {
  return Number(value || 0).toLocaleString('zh-CN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

/** 格式化 HRM 分析项的字典分类 */
export function formatHrmAnalysisDictType(
  dictType: string,
  type: null | number,
): string {
  return type === null ? '未填写' : getDictLabel(dictType, type) || '未知';
}

/** 格式化 HRM 分析项的区间分类 */
export function formatHrmAnalysisRangeType(
  rangeNames: Record<number, string>,
  type: null | number,
): string {
  return type === null ? '未填写' : rangeNames[type] || '未知';
}

export interface HrmLunarDateInfo {
  dayText: string;
  monthDayText: string;
}

/** 获得 HRM 日历农历信息 */
export function getHrmLunarDateInfo(value: string): HrmLunarDateInfo {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return { dayText: '', monthDayText: '' };
  }
  try {
    const solarDay = SolarDay.fromYmd(year, month, day);
    const lunarDay = solarDay.getLunarDay();
    const lunarFestival = lunarDay.getFestival();
    const solarFestival = solarDay.getFestival();
    const lunarDayName = lunarDay.getName();
    return {
      dayText:
        lunarFestival?.getName() || solarFestival?.getName() || lunarDayName,
      monthDayText: `${lunarDay.getLunarMonth().getName()}${lunarDayName}`,
    };
  } catch {
    return { dayText: '', monthDayText: '' };
  }
}

/** 格式化招聘职位薪资范围 */
export function formatRecruitPostSalary(
  post: HrmRecruitPostApi.RecruitPost,
): string {
  if (
    post.minSalary === SALARY_NEGOTIABLE_VALUE &&
    post.maxSalary === SALARY_NEGOTIABLE_VALUE
  ) {
    return '面议';
  }
  const salaryRange = [post.minSalary, post.maxSalary]
    .filter((salary) => salary !== undefined && salary !== null)
    .join('-');
  if (!salaryRange) {
    return '-';
  }
  const salaryUnit =
    post.salaryUnit !== undefined && post.salaryUnit !== null
      ? getDictLabel(DICT_TYPE.HRM_RECRUIT_SALARY_UNIT, post.salaryUnit)
      : '';
  return [salaryRange, salaryUnit].filter(Boolean).join(' ');
}

/** 格式化招聘职位年龄要求 */
export function formatRecruitPostAge(
  post: HrmRecruitPostApi.RecruitPost,
): string {
  if (
    post.minAge === AGE_UNLIMITED_VALUE &&
    post.maxAge === AGE_UNLIMITED_VALUE
  ) {
    return '不限';
  }
  const hasMinAge = post.minAge !== undefined && post.minAge !== null;
  const hasMaxAge = post.maxAge !== undefined && post.maxAge !== null;
  if (hasMinAge && hasMaxAge) {
    return `${post.minAge}-${post.maxAge}`;
  }
  if (hasMinAge) {
    return `${post.minAge} 岁以上`;
  }
  if (hasMaxAge) {
    return `${post.maxAge} 岁以下`;
  }
  return '-';
}

/** 格式化招聘职位进度百分比 */
export function formatRecruitPostSchedule(
  post: HrmRecruitPostApi.RecruitPost,
): string {
  return post.recruitSchedule === undefined || post.recruitSchedule === null
    ? '-'
    : `${post.recruitSchedule}%`;
}

/** 格式化招聘职位进度 */
export function formatRecruitPostProgress(
  post: HrmRecruitPostApi.RecruitPost,
): string {
  const joinedCount = post.hasEntryNum ?? 0;
  const recruitCount = post.recruitNum ?? 0;
  if (!recruitCount) {
    return `${joinedCount} / ${recruitCount}`;
  }
  return `${joinedCount} / ${recruitCount}（${post.recruitSchedule ?? 0}%）`;
}

/** 获得月份起止时间范围 */
export function getHrmMonthRange(month: string): [string, string] {
  const monthDate = dayjs(month);
  return [
    monthDate.startOf('month').format('YYYY-MM-DD HH:mm:ss'),
    monthDate.endOf('month').format('YYYY-MM-DD HH:mm:ss'),
  ];
}

/** 打卡概况文字颜色 class */
export function getHrmOverviewTextClass(value?: string): string {
  if (!value || value === '休息' || value === '未排班') {
    return 'text-muted-foreground';
  }
  if (value.includes('旷工') || value.includes('缺卡')) {
    return 'text-destructive';
  }
  if (value.includes('迟到') || value.includes('早退')) {
    return 'text-warning';
  }
  if (value.includes('正常')) {
    return 'text-success';
  }
  return 'text-primary';
}

/** 格式化班次允许打卡时间范围 */
export function formatHrmShiftTimeRange(
  beginTime: Date | number | string,
  endTime: Date | number | string,
): string {
  return `${formatDate(beginTime, 'MM-DD HH:mm')} 至 ${formatDate(endTime, 'MM-DD HH:mm')}`;
}
