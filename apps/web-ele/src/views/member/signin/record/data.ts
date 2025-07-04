import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { h } from 'vue';

import { ElTag } from 'element-plus';

import { getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'nickname',
      label: '签到用户',
      component: 'Input',
    },
    {
      fieldName: 'day',
      label: '签到天数',
      component: 'Input',
    },
    {
      fieldName: 'createTime',
      label: '签到时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
    },
    {
      field: 'nickname',
      title: '签到用户',
    },
    {
      field: 'day',
      title: '签到天数',
      formatter: ({ cellValue }) => ['第', cellValue, '天'].join(' '),
    },
    {
      field: 'point',
      title: '获得积分',
      slots: {
        default: ({ row }) => {
          return h(
            ElTag,
            {
              class: 'mr-5px',
              color: row.point > 0 ? 'blue' : 'red',
            },
            () => (row.point > 0 ? `+${row.point}` : row.point),
          );
        },
      },
    },
    {
      field: 'createTime',
      title: '签到时间',
      formatter: 'formatDateTime',
    },
  ];
}
