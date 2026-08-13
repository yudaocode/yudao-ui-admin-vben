import type { VbenFormSchema } from '#/adapter/form';

import { FMS_ACCOUNTING_STANDARD_OPTIONS } from '#/views/fms/utils/constants';

/** 财务参数表单 */
export function useFormSchema(
  getLevelOptions: () => { label: string; value: number }[],
): VbenFormSchema[] {
  return [
    {
      fieldName: 'hasParameter',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'baseDivider',
      component: 'Divider',
      label: '',
      renderComponentContent: () => ({
        default: () => ['基础参数'],
      }),
    },
    {
      fieldName: 'companyName',
      label: '公司名称',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'currencyName',
      label: '本位币',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'startTime',
      label: '启用期间',
      component: 'DatePicker',
      componentProps: {
        picker: 'month',
        format: 'YYYY-MM',
        valueFormat: 'x',
        disabled: true,
        allowClear: false,
        class: 'w-full',
      },
    },
    {
      fieldName: 'standard',
      label: '会计制度',
      component: 'Select',
      rules: 'selectRequired',
      componentProps: {
        options: [...FMS_ACCOUNTING_STANDARD_OPTIONS],
        placeholder: '请选择会计制度',
      },
    },
    {
      fieldName: 'subjectDivider',
      component: 'Divider',
      label: '',
      dependencies: {
        triggerFields: ['hasParameter'],
        show: (values) => !!values.hasParameter,
      },
      renderComponentContent: () => ({
        default: () => ['科目参数'],
      }),
    },
    {
      fieldName: 'level',
      label: '科目级次',
      component: 'Select',
      rules: 'selectRequired',
      description: '科目级次和编码长度调大后不能再调小，请谨慎操作',
      dependencies: {
        triggerFields: ['hasParameter'],
        show: (values) => !!values.hasParameter,
        componentProps: () => ({
          options: getLevelOptions(),
          placeholder: '请选择科目级次',
        }),
      },
    },
    {
      fieldName: 'subjectCodeRules',
      label: '编码长度',
      component: 'Input',
      rules: 'required',
      dependencies: {
        triggerFields: ['hasParameter'],
        show: (values) => !!values.hasParameter,
      },
    },
    {
      fieldName: 'ledgerDivider',
      component: 'Divider',
      label: '',
      dependencies: {
        triggerFields: ['hasParameter'],
        show: (values) => !!values.hasParameter,
      },
      renderComponentContent: () => ({
        default: () => ['账簿'],
      }),
    },
    {
      fieldName: 'ledgerBalanceMode',
      label: '账簿余额方向',
      component: 'Input',
      rules: 'required',
      dependencies: {
        triggerFields: ['hasParameter'],
        show: (values) => !!values.hasParameter,
      },
    },
    {
      fieldName: 'voucherReviewRequired',
      label: '结账条件',
      component: 'Checkbox',
      renderComponentContent: () => ({
        default: () => ['凭证审核后才允许结账'],
      }),
      dependencies: {
        triggerFields: ['hasParameter'],
        show: (values) => !!values.hasParameter,
      },
    },
  ];
}
