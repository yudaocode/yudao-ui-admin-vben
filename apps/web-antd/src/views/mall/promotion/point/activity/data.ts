import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';

// TODO @AI：注释
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'status',
      label: '活动状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择活动状态',
        allowClear: true,
      },
    },
  ];
}

// TODO @AI：注释
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '活动编号',
      minWidth: 80,
    },
    {
      field: 'picUrl',
      title: '商品图片',
      minWidth: 80,
      cellRender: {
        name: 'CellImage',
        props: {
          height: 40,
        },
      },
    },
    {
      field: 'spuName',
      title: '商品标题',
      minWidth: 300,
    },
    {
      field: 'marketPrice',
      title: '原价',
      minWidth: 100,
      formatter: 'formatAmount2',
    },
    {
      field: 'status',
      title: '活动状态',
      minWidth: 100,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: {
          type: DICT_TYPE.COMMON_STATUS,
          value: CommonStatusEnum.ENABLE,
        },
      },
    },
    {
      field: 'stock',
      title: '库存',
      minWidth: 80,
    },
    {
      field: 'totalStock',
      title: '总库存',
      minWidth: 80,
    },
    {
      field: 'redeemedQuantity',
      title: '已兑换数量',
      minWidth: 100,

      formatter: ({ row }) => {
        return (row.totalStock || 0) - (row.stock || 0);
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,

      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

// TODO @AI：注释下
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
      fieldName: 'spuId',
      label: '积分商城活动商品',
      component: 'Input',
      rules: 'required',
      formItemClass: 'col-span-2',
      renderComponentContent: () => ({
        default: () => null,
      }),
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
      },
      rules: z.number().default(0),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        rows: 4,
      },
      formItemClass: 'col-span-2',
    },
  ];
}
