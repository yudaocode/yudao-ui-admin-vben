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
      component: 'InputNumber',
      fieldName: 'day',
      label: '签到天数',
      help: '只允许设置 1-7，默认签到 7 天为一个周期',
      componentProps: {
        min: 1,
        max: 7,
        precision: 0,
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'point',
      label: '获得积分',
      componentProps: {
        min: 0,
        precision: 0,
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'experience',
      label: '奖励经验',
      componentProps: {
        min: 0,
        precision: 0,
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
      field: 'day',
      title: '签到天数',
      formatter: ({ cellValue }) => ['第', cellValue, '天'].join(' '),
    },
    {
      field: 'point',
      title: '获得积分',
    },
    {
      field: 'experience',
      title: '奖励经验',
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
