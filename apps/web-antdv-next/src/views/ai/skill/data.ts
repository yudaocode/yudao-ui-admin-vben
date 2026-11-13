import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';

/** 新增/修改的表单 */
export function useFormSchema(isUpdate = false): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: '技能名称',
      rules: z
        .string()
        .min(1, { message: '技能名称不能为空' })
        .max(64, { message: '技能名称不能超过 64 个字符' })
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
          message: '仅支持小写字母、数字、中划线',
        }),
      componentProps: {
        placeholder: '仅小写字母/数字/中划线，如 order-analysis',
        maxlength: 64,
        disabled: isUpdate, // 名称创建后不可修改
      },
    },
    {
      component: 'TextArea',
      fieldName: 'description',
      label: '技能描述',
      rules: z
        .string()
        .max(1024, { message: '技能描述不能超过 1024 个字符' })
        .refine((value) => value.trim().length > 0, {
          message: '技能描述不能为空',
        }),
      componentProps: {
        placeholder: '请输入技能描述',
        rows: 3,
        maxlength: 1024,
        showCount: true,
        disabled: isUpdate, // 修改时以 SKILL.md 为准
      },
      description: isUpdate ? '以 SKILL.md 为准' : undefined,
    },
    {
      component: 'Input',
      fieldName: 'version',
      label: '版本',
      rules: z
        .string()
        .min(1, { message: '版本不能为空' })
        .max(32, { message: '版本不能超过 32 个字符' })
        .default('1.0.0'),
      componentProps: {
        placeholder: '请输入版本',
        maxlength: 32,
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      component: 'Input',
      fieldName: 'remark',
      label: '备注',
      componentProps: {
        placeholder: '请输入备注',
        maxlength: 255,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '技能名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入技能名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '编号',
      minWidth: 80,
    },
    {
      field: 'name',
      title: '技能名称',
      minWidth: 150,
    },
    {
      field: 'description',
      title: '技能描述',
      minWidth: 240,
    },
    {
      field: 'version',
      title: '版本',
      minWidth: 90,
    },
    {
      field: 'fileCount',
      title: '文件数',
      minWidth: 80,
    },
    {
      field: 'roleNames',
      title: '引用角色',
      minWidth: 180,
      slots: { default: 'roleNames' },
    },
    {
      field: 'status',
      title: '状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
      minWidth: 90,
    },
    {
      field: 'updateTime',
      title: '更新时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
