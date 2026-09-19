import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaAttendanceApi } from '#/api/oa/attendance';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { formatDate } from '@vben/utils';

import dayjs from 'dayjs';

import { OA_ATTENDANCE_TYPE } from '#/views/oa/utils/constants';
import { UserSelect } from '#/views/system/user/components';

/** 获得日期所在周的周一 */
export function getWeekStartDate(date: dayjs.Dayjs) {
  return date.subtract((date.day() + 6) % 7, 'day').format('YYYY-MM-DD');
}

/** 获得星期日期列对应的索引，列字段为 day0 ~ day6 */
export function getWeekDayIndex(field: string) {
  return Number(field.slice(3));
}

/** 获得打卡展示文案 */
export function getClockText(
  attendance:
    | OaAttendanceApi.AttendanceWeekReport['dailyAttendances'][number]
    | undefined,
  attendanceType: number,
) {
  const isClockIn = attendanceType === OA_ATTENDANCE_TYPE.CLOCK_IN;
  const attendanceTime = isClockIn
    ? attendance?.clockInTime
    : attendance?.clockOutTime;
  if (!attendanceTime) {
    return '-';
  }
  const status = isClockIn
    ? attendance?.clockInStatus
    : attendance?.clockOutStatus;
  return `${dayjs(attendanceTime).format('HH:mm:ss')} ${getDictLabel(DICT_TYPE.OA_ATTENDANCE_STATUS, status)}`;
}

/** 周报的搜索表单 */
export function useWeekGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'startDate',
      label: '所在周',
      component: 'DatePicker',
      defaultValue: getWeekStartDate(dayjs()),
      componentProps: {
        allowClear: false,
        class: 'w-full',
        placeholder: '请选择周内任意日期',
        valueFormat: 'YYYY-MM-DD',
      },
    },
    {
      fieldName: 'userId',
      label: '员工',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择员工',
      },
    },
  ];
}

/** 周报的表格列：员工、部门和一周内每天的打卡情况 */
export function useWeekGridColumns(
  startDate: string,
): VxeTableGridOptions['columns'] {
  const weekDayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const weekStartDate = dayjs(getWeekStartDate(dayjs(startDate)));
  const dayColumns = weekDayLabels.map((label, index) => ({
    title: `${label} ${weekStartDate.add(index, 'day').format('YYYY-MM-DD').slice(5)}`,
    field: `day${index}`,
    minWidth: 150,
    align: 'center' as const,
    slots: { default: 'dayCell' },
  }));
  return [
    {
      field: 'userName',
      title: '员工',
      width: 120,
      align: 'center',
      fixed: 'left',
    },
    {
      field: 'deptName',
      title: '部门',
      width: 120,
      align: 'center',
      fixed: 'left',
    },
    ...dayColumns,
  ];
}

/** 月报的搜索表单 */
export function useMonthGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'month',
      label: '月份',
      component: 'DatePicker',
      defaultValue: formatDate(new Date(), 'YYYY-MM'),
      componentProps: {
        allowClear: false,
        class: 'w-full',
        picker: 'month',
        placeholder: '请选择月份',
        valueFormat: 'YYYY-MM',
      },
    },
    {
      fieldName: 'userId',
      label: '员工',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择员工',
      },
    },
  ];
}

/** 月报的表格列 */
export function useMonthGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'userName',
      title: '员工',
      minWidth: 120,
      align: 'center',
    },
    {
      field: 'deptName',
      title: '部门',
      minWidth: 120,
      align: 'center',
    },
    {
      field: 'clockInCount',
      title: '上班打卡',
      width: 110,
      align: 'center',
    },
    {
      field: 'clockOutCount',
      title: '下班打卡',
      width: 110,
      align: 'center',
    },
    {
      field: 'normalCount',
      title: '正常次数',
      width: 100,
      align: 'center',
    },
    {
      field: 'lateCount',
      title: '迟到次数',
      width: 100,
      align: 'center',
    },
    {
      field: 'earlyCount',
      title: '早退次数',
      width: 100,
      align: 'center',
    },
    {
      field: 'leaveDays',
      title: '请假天数',
      width: 100,
      align: 'center',
    },
    {
      field: 'travelDays',
      title: '出差天数',
      width: 100,
      align: 'center',
    },
    {
      field: 'absentDays',
      title: '旷工天数',
      minWidth: 150,
      align: 'center',
    },
  ];
}
