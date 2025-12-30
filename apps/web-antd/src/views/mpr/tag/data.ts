import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TagApi } from '#/api/mpr/tag';

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
      fieldName: 'name',
      label: '标签名称',
      rules: 'required',
      component: 'Input',
      componentProps: {
        placeholder: '请输入标签名称',
      },
    },
    {
      fieldName: 'type',
      label: '标签类型',
      component: 'Select',
      componentProps: {
        options: [],
        placeholder: '请选择标签类型',
      },
      dependencies: {
        triggerFields: [''],
        if(_values) {
          return false;
        },
      },
    },
    {
      fieldName: 'description',
      label: '标签描述',
      component: 'Textarea',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '标签名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入标签名称',
      },
    },
    {
      fieldName: 'type',
      label: '标签类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [],
        placeholder: '请选择标签类型',
      },
      dependencies: {
        triggerFields: [''],
        if(_values) {
          return false;
        },
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
export function useGridColumns(): VxeTableGridOptions<TagApi.Tag>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '编号',
      minWidth: 60,
    },
    {
      field: 'name',
      title: '标签名称',
      minWidth: 120,
    },
    {
      field: 'type',
      title: '标签类型',
      minWidth: 120,
      visible: false,
    },
    {
      field: 'description',
      title: '标签描述',
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
