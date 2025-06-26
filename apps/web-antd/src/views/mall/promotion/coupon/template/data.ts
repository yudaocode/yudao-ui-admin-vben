import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

// 格式化函数移到组件内部实现
import { z } from '#/adapter/form';
import {
  CommonStatusEnum,
  DICT_TYPE,
  getDictOptions,
  getRangePickerDefaultProps,
} from '#/utils';

import {
  discountFormat,
  remainedCountFormat,
  takeLimitCountFormat,
  totalCountFormat,
  validityTypeFormat,
} from '../formatter';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '优惠券名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入优惠券名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'description',
      label: '优惠券描述',
      component: 'Textarea',
    },
    // TODO
    {
      fieldName: 'productScope',
      label: '优惠类型',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.PROMOTION_PRODUCT_SCOPE, 'number'),
      },
      rules: 'required',
    },
    {
      fieldName: 'takeType',
      label: '领取方式',
      component: 'Select',
      componentProps: {
        placeholder: '请选择领取方式',
        options: getDictOptions(DICT_TYPE.PROMOTION_COUPON_TAKE_TYPE, 'number'),
      },
      rules: 'required',
    },
    {
      fieldName: 'validityType',
      label: '有效期类型',
      component: 'Select',
      componentProps: {
        placeholder: '请选择有效期类型',
        options: getDictOptions(
          DICT_TYPE.PROMOTION_COUPON_TEMPLATE_VALIDITY_TYPE,
          'number',
        ),
      },
      rules: 'required',
    },
    {
      fieldName: 'totalCount',
      label: '发放数量',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        placeholder: '请输入发放数量',
      },
      rules: 'required',
    },
    {
      fieldName: 'takeLimitCount',
      label: '领取上限',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        placeholder: '请输入领取上限',
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '优惠券状态',
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
      label: '优惠券名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入优惠券名称',
        clearable: true,
      },
    },
    {
      fieldName: 'discountType',
      label: '优惠类型',
      component: 'Select',
      componentProps: {
        placeholder: '请选择优惠类型',
        clearable: true,
        options: getDictOptions(DICT_TYPE.PROMOTION_DISCOUNT_TYPE, 'number'),
      },
    },
    {
      fieldName: 'status',
      label: '优惠券状态',
      component: 'Select',
      componentProps: {
        placeholder: '请选择优惠券状态',
        clearable: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'name',
      title: '优惠券名称',
      minWidth: 140,
    },
    {
      field: 'productScope',
      title: '类型',
      minWidth: 130,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PROMOTION_PRODUCT_SCOPE },
      },
    },
    {
      field: 'discountType',
      title: '优惠',
      minWidth: 110,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PROMOTION_DISCOUNT_TYPE },
      },
    },
    {
      field: 'discountPrice',
      title: '优惠力度',
      minWidth: 110,
      formatter: ({ row }) => {
        return discountFormat(row);
      },
    },
    {
      field: 'takeType',
      title: '领取方式',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PROMOTION_COUPON_TAKE_TYPE },
      },
    },
    {
      field: 'validityType',
      title: '使用时间',
      minWidth: 180,
      formatter: ({ row }) => {
        return validityTypeFormat(row);
      },
    },
    {
      field: 'totalCount',
      title: '发放数量',
      minWidth: 100,
      formatter: ({ row }) => {
        return totalCountFormat(row);
      },
    },
    {
      field: 'remainedCount',
      title: '剩余数量',
      minWidth: 100,
      formatter: ({ row }) => {
        return remainedCountFormat(row);
      },
    },
    {
      field: 'takeLimitCount',
      title: '领取上限',
      minWidth: 100,
      formatter: ({ row }) => {
        return takeLimitCountFormat(row);
      },
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 100,
      slots: { default: 'status' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
