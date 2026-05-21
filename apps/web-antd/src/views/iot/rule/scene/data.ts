import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '规则名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入规则名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '规则状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
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
    { type: 'checkbox', width: 40 },
    {
      field: 'name',
      title: '规则名称',
      minWidth: 200,
      align: 'left',
      showOverflow: false,
      slots: { default: 'name' },
    },
    {
      field: 'triggers',
      title: '触发条件',
      minWidth: 280,
      align: 'left',
      showOverflow: false,
      slots: { default: 'triggers' },
    },
    {
      field: 'actions',
      title: '执行动作',
      minWidth: 250,
      align: 'left',
      showOverflow: false,
      slots: { default: 'actionsCol' },
    },
    {
      field: 'lastTriggeredTime',
      title: '最近触发',
      width: 180,
      slots: { default: 'lastTriggeredTime' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 210,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
