import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  discountFormat,
  remainedCountFormat,
  takeLimitCountFormat,
  usePriceFormat,
  validityTypeFormat,
} from '../formatter';

/** 优惠券选择弹窗的搜索表单 schema */
export function useCouponSelectFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: '优惠券名称',
      componentProps: {
        placeholder: '请输入优惠券名称',
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'discountType',
      label: '优惠类型',
      componentProps: {
        options: getDictOptions(DICT_TYPE.PROMOTION_DISCOUNT_TYPE, 'number'),
        placeholder: '请选择优惠类型',
        allowClear: true,
      },
    },
  ];
}

/** 搜索表单的 schema */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: '优惠券名称',
      componentProps: {
        placeholder: '请输入优惠券名称',
        allowClear: true,
      },
    },
  ];
}

/** 优惠券选择弹窗的表格列配置 */
export function useCouponSelectGridColumns(): VxeGridProps['columns'] {
  return [
    { type: 'checkbox', width: 55 },
    {
      title: '优惠券名称',
      field: 'name',
      minWidth: 140,
    },
    {
      title: '类型',
      field: 'productScope',
      minWidth: 80,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PROMOTION_PRODUCT_SCOPE },
      },
    },
    {
      title: '优惠',
      field: 'discount',
      minWidth: 100,
      slots: { default: 'discount' },
    },
    {
      title: '领取方式',
      field: 'takeType',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PROMOTION_COUPON_TAKE_TYPE },
      },
    },
    {
      title: '使用时间',
      field: 'validityType',
      minWidth: 185,
      align: 'center',
      formatter: ({ row }) => validityTypeFormat(row),
    },
    {
      title: '发放数量',
      field: 'totalCount',
      align: 'center',
      minWidth: 100,
    },
    {
      title: '剩余数量',
      minWidth: 100,
      align: 'center',
      formatter: ({ row }) => remainedCountFormat(row),
    },
    {
      title: '领取上限',
      field: 'takeLimitCount',
      minWidth: 100,
      align: 'center',
      formatter: ({ row }) => takeLimitCountFormat(row),
    },
    {
      title: '状态',
      field: 'status',
      align: 'center',
      minWidth: 80,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
  ];
}

/** 表格列配置 */
export function useGridColumns(): VxeGridProps['columns'] {
  return [
    {
      title: '优惠券名称',
      field: 'name',
      minWidth: 120,
    },
    {
      title: '优惠金额 / 折扣',
      field: 'discount',
      minWidth: 120,
      formatter: ({ row }) => discountFormat(row),
    },
    {
      title: '最低消费',
      field: 'usePrice',
      minWidth: 100,
      formatter: ({ row }) => usePriceFormat(row),
    },
    {
      title: '有效期限',
      field: 'validityType',
      minWidth: 140,
      formatter: ({ row }) => validityTypeFormat(row),
    },
    {
      title: '剩余数量',
      minWidth: 100,
      formatter: ({ row }) => remainedCountFormat(row),
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
