import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'type',
      label: '考勤类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_ATTENDANCE_TYPE, 'number'),
        allowClear: true,
        placeholder: '请选择考勤类型',
      },
    },
    {
      fieldName: 'status',
      label: '考勤状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_ATTENDANCE_STATUS, 'number'),
        allowClear: true,
        placeholder: '请选择考勤状态',
      },
    },
    {
      fieldName: 'attendanceTime',
      label: '考勤时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'type',
      title: '考勤类型',
      width: 110,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_ATTENDANCE_TYPE },
      },
    },
    {
      field: 'status',
      title: '考勤状态',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_ATTENDANCE_STATUS },
      },
    },
    {
      field: 'attendanceTime',
      title: '考勤时间',
      width: 180,
      align: 'center',
      formatter: 'formatDateTime',
    },
    {
      field: 'attendanceIp',
      title: '考勤 IP',
      minWidth: 130,
      align: 'center',
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 180,
      align: 'center',
    },
  ];
}
