import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';

/** 开始迭代的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'RangePicker',
      componentProps: {
        placeholder: ['开始时间', '结束时间'],
        showTime: true,
        valueFormat: 'x',
      },
      fieldName: 'timeRange',
      label: '迭代周期',
      rules: 'required',
    },
  ];
}

/** 新增/修改迭代的表单 */
export function useIterationFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '迭代名称',
      component: 'Input',
      componentProps: {
        maxlength: 100,
        placeholder: '请输入迭代名称',
      },
      rules: z.string().min(1, '迭代名称不能为空'),
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'startTime',
      label: '开始时间',
      component: 'DatePicker',
      componentProps: {
        allowClear: true,
        placeholder: '请选择开始时间',
        showTime: true,
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'endTime',
      label: '结束时间',
      component: 'DatePicker',
      componentProps: {
        allowClear: true,
        placeholder: '请选择结束时间',
        showTime: true,
        valueFormat: 'x',
      },
    },
    {
      fieldName: 'target',
      label: '迭代目标',
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入迭代目标',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'ownerUserId',
      label: '负责人',
      component: 'Select',
      componentProps: {
        allowClear: true,
        optionFilterProp: 'label',
        placeholder: '请选择项目成员',
        showSearch: true,
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'description',
      label: '迭代描述',
      component: 'Textarea',
      componentProps: {
        maxlength: 2000,
        placeholder: '请输入迭代描述',
        rows: 4,
        showCount: true,
      },
      formItemClass: 'col-span-2',
    },
  ];
}
