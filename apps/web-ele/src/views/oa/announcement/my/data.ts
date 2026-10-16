import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRangePickerDefaultProps } from '#/utils';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'title',
      label: '公告标题',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入公告标题',
      },
    },
    {
      fieldName: 'type',
      label: '公告类型',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_ANNOUNCEMENT_TYPE, 'number'),
        clearable: true,
        placeholder: '请选择公告类型',
      },
    },
    {
      fieldName: 'priority',
      label: '优先级',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.OA_PRIORITY, 'number'),
        clearable: true,
        placeholder: '请选择优先级',
      },
    },
    {
      fieldName: 'readStatus',
      label: '阅读状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '未读', value: false },
          { label: '已读', value: true },
        ],
        clearable: true,
        placeholder: '请选择阅读状态',
      },
    },
    {
      fieldName: 'createTime',
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
      field: 'top',
      title: '置顶',
      width: 70,
      align: 'center',
      slots: { default: 'topTag' },
    },
    {
      field: 'title',
      title: '公告标题',
      minWidth: 220,
      slots: { default: 'title' },
    },
    {
      field: 'type',
      title: '类型',
      width: 90,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_ANNOUNCEMENT_TYPE },
      },
    },
    {
      field: 'priority',
      title: '优先级',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.OA_PRIORITY },
      },
    },
    {
      field: 'publisherUserName',
      title: '发布人',
      minWidth: 120,
    },
    {
      field: 'publisherDeptName',
      title: '所属部门',
      minWidth: 140,
    },
    {
      field: 'readStatus',
      title: '阅读状态',
      width: 90,
      align: 'center',
      slots: { default: 'readStatus' },
    },
    {
      field: 'createTime',
      title: '发布时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
