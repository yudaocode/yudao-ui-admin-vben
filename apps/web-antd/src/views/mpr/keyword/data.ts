import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { KeywordApi } from '#/api/mpr/keyword';

import { getRangePickerDefaultProps } from '#/utils';

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
      fieldName: 'label',
      label: '标签',
      component: 'Input',
      componentProps: {
        placeholder: '请输入标签',
      },
    },
    {
      fieldName: 'assistantId',
      label: '助理ID',
      component: 'Input',
      componentProps: {
        placeholder: '请输入助理ID',
      },
    },
    {
      fieldName: 'keyword',
      label: '关键词',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入关键词',
      },
    },
    {
      fieldName: 'userId',
      label: '用户编号',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户编号',
      },
    },
    {
      fieldName: 'description',
      label: '分类说明',
      component: 'RichTextarea',
    },
    {
      fieldName: 'aiInstruction',
      label: 'AI指南',
      component: 'Input',
      componentProps: {
        placeholder: '请输入AI指南',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'label',
      label: '标签',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入标签',
      },
    },
    {
      fieldName: 'assistantId',
      label: '助理ID',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入助理ID',
      },
    },
    {
      fieldName: 'keyword',
      label: '关键词',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入关键词',
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
export function useGridColumns(): VxeTableGridOptions<KeywordApi.Keyword>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '编号',
      minWidth: 120,
    },
    {
      field: 'label',
      title: '标签',
      minWidth: 120,
    },
    {
      field: 'assistantId',
      title: '助理ID',
      minWidth: 120,
    },
    {
      field: 'keyword',
      title: '关键词',
      minWidth: 120,
    },
    {
      field: 'userId',
      title: '用户编号',
      minWidth: 120,
    },
    {
      field: 'description',
      title: '分类说明',
      minWidth: 120,
    },
    {
      field: 'aiInstruction',
      title: 'AI指南',
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
