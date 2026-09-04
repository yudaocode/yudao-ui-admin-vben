import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import { HrmAttendanceHolidayType } from '#/views/hrm/utils/constants';

/** 新增/修改节假日表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'date',
      label: '日期',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        class: 'w-full',
        placeholder: '请选择日期',
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'type',
      label: '日期类型',
      component: 'Select',
      rules: z.number().default(HrmAttendanceHolidayType.REST),
      componentProps: {
        options: getDictOptions(
          DICT_TYPE.HRM_ATTENDANCE_HOLIDAY_TYPE,
          'number',
        ),
        placeholder: '请选择日期类型',
      },
    },
  ];
}

export function useGridFormSchema() {
  return [
    {
      fieldName: 'date',
      label: '日期',
      component: 'RangePicker',
      componentProps: {
        clearable: true,
        valueFormat: 'YYYY-MM-DD',
      },
    },
    {
      fieldName: 'type',
      label: '日期类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [],
        placeholder: '请选择日期类型',
      },
    },
  ];
}

export function useGridColumns(): VxeGridProps['columns'] {
  return [
    { field: 'id', title: '编号', width: 100, align: 'center' },
    {
      field: 'date',
      title: '日期',
      minWidth: 180,
      formatter: 'formatDate',
    },
    {
      field: 'type',
      title: '日期类型',
      width: 140,
      slots: { default: 'type' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
