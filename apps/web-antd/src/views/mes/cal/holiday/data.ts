import type { VbenFormSchema } from '#/adapter/form';

import { DICT_TYPE, HolidayType } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';

/** 假期设置表单 */
export function useHolidayFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'day',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'dayDisplay',
      label: '日期',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'type',
      label: '类型',
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.MES_CAL_HOLIDAY_TYPE, 'number'),
      },
      rules: z.number().default(HolidayType.WORKDAY),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}
