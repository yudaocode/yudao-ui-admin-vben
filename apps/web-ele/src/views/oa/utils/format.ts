import type { CSSProperties } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictObj } from '@vben/hooks';
import { isValidColor } from '@vben/utils';

import dayjs from 'dayjs';

import { OA_TASK_STATUS } from './constants';

// TODO DONE @AI：移除车辆状态、还车状态、共享类型和共享权限的字典包装，调用处直接使用 getDictLabel。

/** 获得讨论投票方式 */
export function getDiscussionVoteModeName(multiple?: boolean) {
  return multiple ? '多选' : '单选';
}

/** 获得任务状态进度 */
export function getTaskStatusProgress(status?: number) {
  const statuses: number[] = Object.values(OA_TASK_STATUS);
  return status && statuses.includes(status) ? status * 20 : 0;
}

/** 获得工作汇报周次：包含 1 月 1 日的周为当年第 1 周 */
export function formatWorkReportWeek(value: number | string) {
  const date = dayjs(value);
  const weekStartTime = date
    .startOf('day')
    .subtract((date.day() + 6) % 7, 'day');
  // 跨年的同一自然周统一归属周日所在年份
  const year = weekStartTime.add(6, 'day').year();
  const yearStartTime = dayjs(year + '-01-01');
  const firstWeekStartTime = yearStartTime.subtract(
    (yearStartTime.day() + 6) % 7,
    'day',
  );
  const weekNumber =
    Math.floor(weekStartTime.diff(firstWeekStartTime, 'day') / 7) + 1;
  return year + '-' + String(weekNumber).padStart(2, '0');
}

/** 获得指定周次的开始日期 */
export function getWorkReportWeekStart(week: string) {
  const [year = 0, weekNumber = 0] = week.split('-').map(Number);
  const yearStartTime = dayjs(year + '-01-01');
  return yearStartTime
    .subtract((yearStartTime.day() + 6) % 7, 'day')
    .add(weekNumber - 1, 'week');
}

/** 获得周次选择项 */
export function getWorkReportWeekOptions(year: number) {
  // 该年周数由下一年第一周开始时间与当年第一周开始时间的差值计算
  const firstWeekStartTime = getWorkReportWeekStart(`${year}-01`);
  const nextYearFirstWeekStartTime = getWorkReportWeekStart(`${year + 1}-01`);
  const weekCount = nextYearFirstWeekStartTime.diff(firstWeekStartTime, 'week');
  return Array.from({ length: weekCount }, (_, index) => {
    const value = year + '-' + String(index + 1).padStart(2, '0');
    const startTime = getWorkReportWeekStart(value);
    return {
      value,
      label: `${year}年第${index + 1}周（${startTime.format('MM-DD')}~${startTime.add(6, 'day').format('MM-DD')}）`,
    };
  });
}

/** OA 日程条默认颜色 */
const OA_SCHEDULE_DEFAULT_STYLE: CSSProperties = {
  backgroundColor: 'hsl(var(--primary) / 0.1)',
  color: 'hsl(var(--primary))',
};

/** OA 日程条优先级颜色映射，对齐字典回显色 */
const OA_PRIORITY_COLOR_STYLES = new Map<string, CSSProperties>([
  [
    'danger',
    {
      backgroundColor: 'hsl(var(--destructive) / 0.1)',
      color: 'hsl(var(--destructive))',
    },
  ],
  [
    'error',
    {
      backgroundColor: 'hsl(var(--destructive) / 0.1)',
      color: 'hsl(var(--destructive))',
    },
  ],
  [
    'info',
    {
      backgroundColor: 'hsl(var(--muted))',
      color: 'hsl(var(--muted-foreground))',
    },
  ],
  ['primary', OA_SCHEDULE_DEFAULT_STYLE],
  [
    'success',
    {
      backgroundColor: 'hsl(var(--success) / 0.1)',
      color: 'hsl(var(--success))',
    },
  ],
  [
    'warning',
    {
      backgroundColor: 'hsl(var(--warning) / 0.1)',
      color: 'hsl(var(--warning))',
    },
  ],
]);

/** 获得日程条优先级颜色，与字典标签颜色保持一致 */
export function getOaPriorityStyle(priority?: number): CSSProperties {
  const dict =
    priority === undefined || priority === null
      ? null
      : getDictObj(DICT_TYPE.OA_PRIORITY, String(priority));
  if (dict?.cssClass && isValidColor(dict.cssClass)) {
    return {
      backgroundColor: dict.cssClass,
      color: 'hsl(var(--primary-foreground))',
    };
  }
  return (
    OA_PRIORITY_COLOR_STYLES.get(dict?.colorType || 'primary') ??
    OA_SCHEDULE_DEFAULT_STYLE
  );
}
