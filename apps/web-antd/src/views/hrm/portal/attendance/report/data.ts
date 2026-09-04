import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmAttendanceLeaveApi } from '#/api/hrm/attendance/leave';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import dayjs from 'dayjs';

import { z } from '#/adapter/form';

/** 请假申请表单 */
export function useLeaveFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'type',
      label: '请假类型',
      component: 'Select',
      rules: 'required',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE, 'string'),
        placeholder: '请选择请假类型',
      },
    },
    {
      fieldName: 'startTime',
      label: '开始时间',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        class: 'w-full',
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择开始时间',
        showTime: true,
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'endTime',
      label: '结束时间',
      component: 'DatePicker',
      componentProps: {
        class: 'w-full',
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择结束时间',
        showTime: true,
        valueFormat: 'x',
      },
      dependencies: {
        triggerFields: ['startTime', 'endTime'],
        rules(values) {
          return z
            .any()
            .refine(
              (value) => value !== null && value !== undefined && value !== '',
              '请选择结束时间',
            )
            .refine(
              (value) =>
                value === null ||
                value === undefined ||
                value === '' ||
                values.startTime === null ||
                values.startTime === undefined ||
                values.startTime === '' ||
                dayjs(Number(value)).isAfter(dayjs(Number(values.startTime))),
              '结束时间必须晚于开始时间',
            );
        },
      },
    },
    {
      fieldName: 'day',
      label: '请假天数',
      component: 'InputNumber',
      defaultValue: 1,
      rules: z.coerce.number().min(0.01, '请输入请假天数'),
      componentProps: {
        class: 'w-full',
        min: 0.01,
        placeholder: '请输入请假天数',
        precision: 2,
        step: 0.5,
      },
    },
    {
      fieldName: 'reason',
      label: '请假事由',
      component: 'Textarea',
      rules: z.string().min(1, '请输入请假事由').max(300),
      componentProps: {
        maxlength: 300,
        placeholder: '请输入请假事由',
        rows: 3,
        showCount: true,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        maxlength: 500,
        placeholder: '请输入备注',
        rows: 2,
        showCount: true,
      },
    },
  ];
}

/** 我的请假申请列表字段 */
export function useLeaveGridColumns(): VxeTableGridOptions<HrmAttendanceLeaveApi.AttendanceLeave>['columns'] {
  return [
    {
      field: 'type',
      title: '请假类型',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE },
      },
    },
    {
      field: 'startTime',
      title: '开始时间',
      width: 170,
      formatter: 'formatDateTime',
    },
    {
      field: 'endTime',
      title: '结束时间',
      width: 170,
      formatter: 'formatDateTime',
    },
    {
      field: 'day',
      title: '请假天数',
      width: 100,
      formatter: ({ cellValue }) => `${cellValue || 0} 天`,
    },
    {
      field: 'reason',
      title: '请假事由',
      minWidth: 180,
      showOverflow: true,
    },
    {
      field: 'approvalStatus',
      title: '审批状态',
      width: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS },
      },
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
