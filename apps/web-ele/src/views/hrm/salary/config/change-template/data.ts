import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { markRaw } from 'vue';

import { z } from '#/adapter/form';

import ChangeOptionSelect from '../option/components/change-option-select.vue';

/** 新增/修改调薪模板表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'name',
      label: '模板名称',
      component: 'Input',
      rules: 'required',
      componentProps: { maxlength: 64, placeholder: '请输入模板名称' },
    },
    {
      fieldName: 'defaultStatus',
      label: '默认模板',
      component: 'Switch',
      rules: z.boolean().default(false),
    },
    {
      fieldName: 'options',
      label: '调薪项',
      component: markRaw(ChangeOptionSelect),
    },
  ];
}

export function useGridColumns(): VxeGridProps['columns'] {
  return [
    { field: 'name', title: '模板名称', minWidth: 180 },
    {
      field: 'defaultStatus',
      title: '默认模板',
      width: 100,
      slots: { default: 'defaultStatus' },
    },
    {
      field: 'options',
      title: '调薪项',
      minWidth: 260,
      slots: { default: 'options' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
