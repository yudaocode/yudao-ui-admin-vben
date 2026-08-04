import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmAttendanceClockApi } from '#/api/hrm/attendance/clock';

import { markRaw } from 'vue';

import { z } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate, handleTree } from '@vben/utils';

import dayjs from 'dayjs';

import { getSimpleDeptList } from '#/api/system/dept';
import EmployeeSelect from '#/views/hrm/employee/components/employee-select.vue';
import { HrmAttendanceClockType } from '#/views/hrm/utils/constants';

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

/** 打卡概况搜索表单 */
export function useOverviewFormSchema(): VbenFormSchema[] {
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
  ];
}

/** 打卡明细搜索表单 */
export function useRecordGridFormSchema(): VbenFormSchema[] {
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
      fieldName: 'type',
      label: '打卡类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.HRM_ATTENDANCE_CLOCK_TYPE, 'number'),
        placeholder: '请选择打卡类型',
      },
    },
    {
      fieldName: 'address',
      label: '打卡地点',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入打卡地点',
      },
    },
    {
      fieldName: 'sourceTypes',
      label: '打卡来源',
      component: 'Select',
      componentProps: {
        allowClear: true,
        mode: 'multiple',
        options: getDictOptions(
          DICT_TYPE.HRM_ATTENDANCE_CLOCK_SOURCE,
          'number',
        ),
        placeholder: '请选择打卡来源',
      },
    },
  ];
}

/** 打卡明细列表字段 */
export function useRecordGridColumns(): VxeTableGridOptions<HrmAttendanceClockApi.AttendanceClock>['columns'] {
  return [
    { type: 'checkbox' as const, width: 48 },
    { field: 'employeeName', title: '员工', width: 100, showOverflow: true },
    { field: 'jobNumber', title: '工号', width: 100, showOverflow: true },
    { field: 'deptName', title: '部门', width: 120, showOverflow: true },
    { field: 'postName', title: '岗位', width: 120, showOverflow: true },
    {
      field: 'type',
      title: '打卡类型',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_ATTENDANCE_CLOCK_TYPE },
      },
    },
    {
      field: 'attendanceTime',
      title: '应打卡时间',
      width: 170,
      formatter: 'formatDateTime',
    },
    {
      field: 'clockTime',
      title: '打卡时间',
      width: 170,
      formatter: 'formatDateTime',
    },
    {
      field: 'status',
      title: '状态',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_ATTENDANCE_CLOCK_STATUS },
      },
    },
    {
      field: 'sourceType',
      title: '打卡来源',
      width: 105,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_ATTENDANCE_CLOCK_SOURCE },
      },
    },
    { field: 'address', title: '打卡地点', width: 130, showOverflow: true },
    { field: 'remark', title: '备注', minWidth: 140, showOverflow: true },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 补录打卡表单 */
export function useClockFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'formType',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'employeeId',
      label: '员工',
      component: markRaw(EmployeeSelect),
      rules: 'required',
      dependencies: {
        triggerFields: ['formType'],
        disabled: (values) => values.formType === 'update',
      },
    },
    {
      fieldName: 'type',
      label: '打卡类型',
      component: 'Select',
      rules: z.number().default(HrmAttendanceClockType.ON_DUTY),
      componentProps: {
        options: getDictOptions(DICT_TYPE.HRM_ATTENDANCE_CLOCK_TYPE, 'number'),
        placeholder: '请选择打卡类型',
      },
    },
    {
      fieldName: 'attendanceTime',
      label: '打卡日期',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        class: 'w-full',
        placeholder: '请选择打卡日期',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'clockTime',
      label: '打卡时间',
      component: 'TimePicker',
      rules: 'required',
      componentProps: {
        class: 'w-full',
        format: 'HH:mm:ss',
        placeholder: '请选择打卡时间',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}

/** 构建概况查询参数 */
export function buildOverviewQueryParams(formValues: Record<string, unknown>) {
  const month = dayjs(
    String(formValues.month || formatDate(new Date(), 'YYYY-MM')),
  );
  return {
    ...formValues,
    month: month.month() + 1,
    year: month.year(),
  };
}

/** 构建明细查询参数 */
export function buildRecordQueryParams(formValues: Record<string, unknown>) {
  const month = String(formValues.month || formatDate(new Date(), 'YYYY-MM'));
  const { search, deptIds, type, address, sourceTypes } = formValues;
  return {
    search,
    deptIds,
    type,
    address,
    sourceTypes,
    attendanceTime: [
      dayjs(month).startOf('month').format('YYYY-MM-DD HH:mm:ss'),
      dayjs(month).endOf('month').format('YYYY-MM-DD HH:mm:ss'),
    ],
  };
}
