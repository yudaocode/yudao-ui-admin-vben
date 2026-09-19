import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRangePickerDefaultProps } from '#/utils';
import { UserSelect } from '#/views/system/user/components';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'title',
      label: '任务标题',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入任务标题',
      },
    },
    {
      fieldName: 'type',
      label: '任务类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_TASK_TYPE, 'number'),
        clearable: true,
        placeholder: '请选择类型',
      },
    },
    {
      fieldName: 'status',
      label: '任务状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_TASK_STATUS, 'number'),
        clearable: true,
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'canceled',
      label: '取消状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '正常', value: false },
          { label: '已取消', value: true },
        ],
        clearable: true,
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'publisherUserId',
      label: '发布人',
      component: markRaw(UserSelect),
      componentProps: {
        clearable: true,
        placeholder: '请选择发布人',
      },
    },
    {
      fieldName: 'publishTime',
      label: '发布时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'title',
      title: '任务标题',
      minWidth: 200,
      slots: { default: 'title' },
    },
    {
      field: 'type',
      title: '类型',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_TASK_TYPE },
      },
    },
    {
      field: 'publisherUserName',
      title: '发布人',
      width: 110,
    },
    {
      field: 'publisherDeptName',
      title: '发布部门',
      width: 120,
    },
    {
      field: 'receiverStatus',
      title: '我的状态',
      width: 105,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_TASK_STATUS },
      },
    },
    {
      title: '进度',
      minWidth: 150,
      slots: { default: 'statusProgress' },
    },
    {
      title: '任务周期',
      minWidth: 220,
      slots: { default: 'period' },
    },
    {
      field: 'canceled',
      title: '取消状态',
      width: 90,
      slots: { default: 'canceledTag' },
    },
    {
      field: 'publishTime',
      title: '发布时间',
      width: 180,
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
