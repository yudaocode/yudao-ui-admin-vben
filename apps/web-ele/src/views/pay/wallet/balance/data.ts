import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '用户编号',
      component: 'Input',
    },
    {
      fieldName: 'userType',
      label: '用户类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.USER_TYPE, 'number'),
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        allowClear: true,
        ...getRangePickerDefaultProps(),
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      title: '编号',
      field: 'id',
    },
    {
      title: '用户编号',
      field: 'userId',
    },
    {
      title: '用户类型',
      field: 'userType',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.USER_TYPE },
      },
    },
    {
      title: '余额',
      field: 'balance',
      formatter: 'formatFenToYuanAmount',
    },
    {
      title: '累计支出',
      field: 'totalExpense',
      formatter: 'formatFenToYuanAmount',
    },
    {
      title: '累计充值',
      field: 'totalRecharge',
      formatter: 'formatFenToYuanAmount',
    },
    {
      title: '冻结金额',
      field: 'freezePrice',
      formatter: 'formatFenToYuanAmount',
    },
    {
      title: '创建时间',
      field: 'createTime',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      field: 'actions',
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
