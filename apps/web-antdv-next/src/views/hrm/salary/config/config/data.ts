import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import {
  HrmSalarySocialSecurityMonthType,
  HrmSalarySocialSecurityMonthTypeOptions,
} from '#/views/hrm/utils/constants';

/** 计薪设置表单 */
export function useFormSchema(initialized: boolean): VbenFormSchema[] {
  return [
    {
      fieldName: 'cycleStartDay',
      label: '计薪周期开始日',
      component: 'InputNumber',
      rules: z.number().min(1).max(31).default(1),
      componentProps: { disabled: initialized, max: 31, min: 1 },
    },
    {
      fieldName: 'cycleEndDay',
      label: '工资周期结束日',
      component: 'InputNumber',
      defaultValue: 31,
      componentProps: { disabled: true, max: 31, min: 1 },
    },
    {
      fieldName: 'startYearMonth',
      label: '薪资启用月份',
      component: 'DatePicker',
      componentProps: { picker: 'month', valueFormat: 'YYYY-MM' },
      dependencies: {
        triggerFields: [''],
        show: () => !initialized,
        rules: () => (initialized ? z.string().optional() : z.string()),
      },
    },
    {
      fieldName: 'socialSecurityMonthType',
      label: '对应社保自然月',
      component: 'RadioGroup',
      rules: z
        .number()
        .default(HrmSalarySocialSecurityMonthType.PREVIOUS_MONTH),
      componentProps: { options: HrmSalarySocialSecurityMonthTypeOptions },
    },
  ];
}
