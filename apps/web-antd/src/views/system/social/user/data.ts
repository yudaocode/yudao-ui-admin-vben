import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'type',
      label: '社交平台',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_SOCIAL_TYPE, 'number'),
        placeholder: '请选择社交平台',
        allowClear: true,
      },
    },
    {
      fieldName: 'nickname',
      label: '用户昵称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户昵称',
        allowClear: true,
      },
    },
    {
      fieldName: 'openid',
      label: '社交 openid',
      component: 'Input',
      componentProps: {
        placeholder: '请输入社交 openid',
        allowClear: true,
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
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
      field: 'type',
      title: '社交平台',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_SOCIAL_TYPE },
      },
    },
    {
      field: 'openid',
      title: '社交 openid',
    },
    {
      field: 'nickname',
      title: '用户昵称',
    },
    {
      field: 'avatar',
      title: '用户头像',
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      field: 'updateTime',
      title: '更新时间',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
