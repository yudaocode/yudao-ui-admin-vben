import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

/** 选择监听器弹窗的列表字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'name', title: '名字', minWidth: 160 },
    {
      field: 'type',
      title: '类型',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.BPM_PROCESS_LISTENER_TYPE },
      },
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    { field: 'event', title: '事件', minWidth: 120 },
    {
      field: 'valueType',
      title: '值类型',
      minWidth: 200,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.BPM_PROCESS_LISTENER_VALUE_TYPE },
      },
    },
    { field: 'value', title: '值', minWidth: 150 },
    {
      title: '操作',
      width: 100,
      slots: { default: 'action' },
      fixed: 'right',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '名字',
      component: 'Input',
      componentProps: {
        placeholder: '请输入名字',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      defaultValue: CommonStatusEnum.ENABLE,
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
        disabled: true,
      },
    },
  ];
}
