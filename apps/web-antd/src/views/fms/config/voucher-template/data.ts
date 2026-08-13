import type { VbenFormSchema } from '#/adapter/form';

/** 模板分类表单 */
export function useCategoryFormSchema(): VbenFormSchema[] {
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
      label: '分类名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入分类名称',
        maxlength: 255,
        allowClear: true,
      },
    },
  ];
}
