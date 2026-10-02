import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';

export const schema: VbenFormSchema[] = [
  {
    component: 'RadioGroup',
    fieldName: 'enabled',
    label: '客户公海规则设置',
    componentProps: {
      options: [
        { label: '开启', value: true },
        { label: '关闭', value: false },
      ],
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'contactExpireDays',
    componentProps: {
      min: 0,
      precision: 0,
      placeholder: '请输入天数',
      class: '!w-full',
    },
    renderComponentContent: () => ({
      append: () => '天不跟进或',
    }),
    rules: z.preprocess(
      (value) => (value === '' || value === null ? undefined : value),
      z.coerce.number().int().min(0, '天数不能小于 0'),
    ),
    dependencies: {
      triggerFields: ['enabled'],
      show: (value) => value.enabled,
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'dealExpireDays',
    componentProps: {
      min: 0,
      precision: 0,
      placeholder: '请输入天数',
      class: '!w-full',
    },
    renderComponentContent: () => ({
      prepend: () => '或',
      append: () => '天未成交',
    }),
    rules: z.preprocess(
      (value) => (value === '' || value === null ? undefined : value),
      z.coerce.number().int().min(0, '天数不能小于 0'),
    ),
    dependencies: {
      triggerFields: ['enabled'],
      show: (value) => value.enabled,
    },
  },
  {
    component: 'RadioGroup',
    fieldName: 'notifyEnabled',
    label: '提前提醒设置',
    componentProps: {
      options: [
        { label: '开启', value: true },
        { label: '关闭', value: false },
      ],
    },
    dependencies: {
      triggerFields: ['enabled'],
      show: (value) => value.enabled,
    },
    defaultValue: false,
  },
  {
    component: 'InputNumber',
    fieldName: 'notifyDays',
    componentProps: {
      min: 0,
      precision: 0,
      placeholder: '请输入天数',
      class: '!w-full',
    },
    renderComponentContent: () => ({
      prepend: () => '提前',
      append: () => '天提醒',
    }),
    rules: z.preprocess(
      (value) => (value === '' || value === null ? undefined : value),
      z.coerce.number().int().min(0, '天数不能小于 0'),
    ),
    dependencies: {
      triggerFields: ['notifyEnabled'],
      show: (value) => value.enabled && value.notifyEnabled,
    },
  },
];
