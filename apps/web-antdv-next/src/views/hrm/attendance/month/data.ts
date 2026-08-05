import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmAttendanceStatisticsApi } from '#/api/hrm/attendance/statistics';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate, handleTree } from '@vben/utils';

import { getSimpleDeptList } from '#/api/system/dept';
import { formatHrmDays, formatHrmMoney } from '#/views/hrm/utils/format';

/** 部门多选 ApiTreeSelect 配置 */
export function useDeptTreeSelectProps() {
  return {
    api: async () => handleTree(await getSimpleDeptList()),
    fieldNames: { label: 'name', value: 'id', children: 'children' },
    multiple: true,
    placeholder: '请选择部门',
    treeDefaultExpandAll: true,
  };
}

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
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
        valueFormat: 'YYYY-MM',
      },
    },
    {
      fieldName: 'search',
      label: '员工',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入员工姓名或工号',
      },
    },
    {
      fieldName: 'deptIds',
      label: '部门',
      component: 'ApiTreeSelect',
      componentProps: useDeptTreeSelectProps(),
    },
    {
      fieldName: 'fullAttendance',
      label: '是否全勤',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.HRM_ATTENDANCE_YES_NO, 'number').map(
          (item) => ({
            label: item.label,
            value: item.value === 1,
          }),
        ),
        placeholder: '请选择',
      },
    },
  ];
}

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<HrmAttendanceStatisticsApi.MonthRecord>['columns'] {
  return [
    {
      field: 'employeeName',
      title: '员工',
      minWidth: 120,
      fixed: 'left',
      showOverflow: true,
      slots: { default: 'employeeName' },
    },
    { field: 'jobNumber', title: '工号', minWidth: 110, showOverflow: true },
    { field: 'deptName', title: '部门', minWidth: 120, showOverflow: true },
    { field: 'postName', title: '岗位', minWidth: 120, showOverflow: true },
    { field: 'attendDays', title: '应出勤天数', width: 110 },
    {
      field: 'actualDays',
      title: '实际出勤天数',
      width: 120,
      formatter: ({ cellValue }) => formatHrmDays(cellValue),
    },
    { field: 'lateMinute', title: '迟到时长（分钟）', width: 140 },
    { field: 'lateCount', title: '迟到次数', width: 100 },
    { field: 'earlyMinute', title: '早退时长（分钟）', width: 140 },
    { field: 'earlyCount', title: '早退次数', width: 100 },
    {
      field: 'absenteeismDays',
      title: '旷工天数',
      width: 100,
      formatter: ({ cellValue }) => formatHrmDays(cellValue),
    },
    { field: 'misscardCount', title: '缺卡次数', width: 100 },
    {
      field: 'leaveDays',
      title: '请假天数',
      width: 100,
      formatter: ({ cellValue }) => formatHrmDays(cellValue),
    },
    {
      field: 'attendanceDeductAmount',
      title: '考勤扣款',
      width: 110,
      formatter: ({ cellValue }) => `${formatHrmMoney(cellValue)} 元`,
    },
  ];
}

/** 构建列表查询参数 */
export function buildMonthQueryParams(formValues: Record<string, unknown>) {
  const month = String(formValues.month || formatDate(new Date(), 'YYYY-MM'));
  const [year = 0, monthNum = 0] = month.split('-').map(Number);
  return {
    search:
      typeof formValues.search === 'string' ? formValues.search : undefined,
    deptIds: Array.isArray(formValues.deptIds)
      ? formValues.deptIds.filter((id): id is number => typeof id === 'number')
      : undefined,
    fullAttendance:
      typeof formValues.fullAttendance === 'boolean'
        ? formValues.fullAttendance
        : undefined,
    year,
    month: monthNum,
  };
}
