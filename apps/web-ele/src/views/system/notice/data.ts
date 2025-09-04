import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemNoticeApi } from '#/api/system/notice';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps, } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'title',
      label: '公告标题',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入公告标题',
      },
    },
    {
      fieldName: 'content',
      label: '公告内容',
      rules: 'required',
      component: 'RichTextarea',
    },
    {
      fieldName: 'type',
      label: '公告类型（1通知 2公告）',
      rules: 'required',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_NOTICE_TYPE, 'number'),
        placeholder: '请选择公告类型（1通知 2公告）',
      },
    },
    {
      fieldName: 'status',
      label: '公告状态（0正常 1关闭）',
      rules: 'required',
      component: 'RadioGroup',
      componentProps: {
        options: [],
        buttonStyle: 'solid',
        optionType: 'button',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'title',
      label: '公告标题',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入公告标题',
      },
    },
    {
      fieldName: 'content',
      label: '公告内容',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入公告内容',
      },
    },
    {
      fieldName: 'type',
      label: '公告类型（1通知 2公告）',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.SYSTEM_NOTICE_TYPE, 'number'),
        placeholder: '请选择公告类型（1通知 2公告）',
      },
    },
    {
      fieldName: 'status',
      label: '公告状态（0正常 1关闭）',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [],
        placeholder: '请选择公告状态（0正常 1关闭）',
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
export function useGridColumns(): VxeTableGridOptions<SystemNoticeApi.Notice>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '公告ID',
      minWidth: 120,
    },
    {
      field: 'title',
      title: '公告标题',
      minWidth: 120,
    },
    {
      field: 'content',
      title: '公告内容',
      minWidth: 120,
    },
    {
      field: 'type',
      title: '公告类型（1通知 2公告）',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_NOTICE_TYPE },
      },
    },
    {
      field: 'status',
      title: '公告状态（0正常 1关闭）',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
