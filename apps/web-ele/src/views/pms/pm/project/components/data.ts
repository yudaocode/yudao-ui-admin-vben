import type { VbenFormSchema } from '#/adapter/form';

import { markRaw } from 'vue';

import { z } from '#/adapter/form';
import {
  PmsProjectLevel,
  PmsProjectType,
} from '#/views/pms/pm/utils/constants';
import { UserSelect } from '#/views/system/user/components';

/** 校验项目时间范围：开始时间必须早于截止时间 */
function validateProjectTimeRange(startTime: unknown, endTime: unknown) {
  return z
    .any()
    .refine(
      () => !startTime || !endTime || Number(startTime) < Number(endTime),
      '开始时间必须早于截止时间',
    )
    .optional();
}

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'id',
    },
    {
      component: 'InputNumber',
      defaultValue: PmsProjectLevel.NORMAL,
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'level',
    },
    {
      component: 'RadioGroup',
      defaultValue: PmsProjectType.GENERAL,
      dependencies: {
        show: (values) => !values.id,
        triggerFields: ['id'],
      },
      fieldName: 'type',
      label: '项目类型',
      rules: z.number({ message: '请选择项目类型' }),
    },
    {
      component: 'Input',
      componentProps: {
        clearable: true,
        maxlength: 31,
        placeholder: '请输入项目名称',
        showWordLimit: true,
      },
      defaultValue: '',
      fieldName: 'name',
      formItemClass: 'col-span-1',
      label: '项目名称',
      rules: z.string({ message: '请输入项目名称' }).min(1, '请输入项目名称'),
    },
    {
      component: 'IconPicker',
      componentProps: {
        clearable: true,
      },
      defaultValue: 'ep:folder',
      fieldName: 'icon',
      formItemClass: 'col-span-1',
      label: '项目封面',
      rules: z.string({ message: '请选择项目封面' }).min(1, '请选择项目封面'),
    },
    {
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择开始时间',
        showTime: true,
        valueFormat: 'x',
      },
      dependencies: {
        rules: (values) =>
          validateProjectTimeRange(values.startTime, values.endTime),
        triggerFields: ['startTime', 'endTime'],
      },
      fieldName: 'startTime',
      formItemClass: 'col-span-1',
      label: '开始时间',
    },
    {
      component: 'DatePicker',
      componentProps: {
        placeholder: '请选择截止时间',
        showTime: true,
        valueFormat: 'x',
      },
      dependencies: {
        rules: (values) =>
          validateProjectTimeRange(values.startTime, values.endTime),
        triggerFields: ['startTime', 'endTime'],
      },
      fieldName: 'endTime',
      formItemClass: 'col-span-1',
      label: '截止时间',
    },
    {
      component: 'Textarea',
      componentProps: {
        type: 'textarea',
        maxlength: 500,
        placeholder: '请输入项目描述',
        rows: 3,
        showWordLimit: true,
      },
      defaultValue: '',
      fieldName: 'description',
      label: '项目描述',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '私有：只有项目成员可以查看', value: false },
          { label: '公开：所有人可查看，只有项目成员可以编辑', value: true },
        ],
      },
      defaultValue: false,
      fieldName: 'openStatus',
      label: '可见范围',
      rules: z.boolean({ message: '请选择项目可见范围' }),
    },
    {
      component: markRaw(UserSelect),
      componentProps: {
        multiple: true,
        placeholder: '请选择项目成员；创建人会自动加入',
      },
      defaultValue: [],
      dependencies: {
        show: (values) => !values.id && !values.openStatus,
        triggerFields: ['id', 'openStatus'],
      },
      fieldName: 'memberUserIds',
      label: '项目成员',
    },
  ];
}
