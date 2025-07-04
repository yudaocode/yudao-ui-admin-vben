import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { z } from '#/adapter/form';
import { CommonStatusEnum, DICT_TYPE, getDictOptions } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
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
      label: '等级名称',
    },
    {
      component: 'InputNumber',
      fieldName: 'level',
      label: '等级',
      componentProps: {
        min: 0,
        precision: 0,
      },
    },
    {
      fieldName: 'experience',
      label: '升级经验',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 0,
      },
    },
    {
      fieldName: 'discountPercent',
      label: '享受折扣(%)',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 100,
        precision: 0,
      },
    },
    {
      component: 'ImageUpload',
      fieldName: 'icon',
      label: '等级图标',
    },
    {
      component: 'ImageUpload',
      fieldName: 'backgroundUrl',
      label: '等级背景图',
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
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '等级名称',
      component: 'Input',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
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
    },
    {
      field: 'icon',
      title: '等级图标',
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'backgroundUrl',
      title: '等级背景图',
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      field: 'name',
      title: '等级名称',
    },
    {
      field: 'level',
      title: '等级',
    },
    {
      field: 'experience',
      title: '升级经验',
    },
    {
      field: 'discountPercent',
      title: '享受折扣(%)',
    },
    {
      field: 'status',
      title: '状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
