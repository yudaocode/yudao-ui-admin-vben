import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PriceReferenceApi } from '#/api/mpr/priceReference';
import type { DescriptionItemSchema } from '#/components/description';

import { formatDateTime } from '@vben/utils';

import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(handleChange): VbenFormSchema[] {
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
      fieldName: 'goodsId',
      label: 'FB商品ID',
      component: 'Input',
      componentProps: {
        placeholder: '请输入FB商品ID',
      },
      dependencies: {
        triggerFields: [''],
        show: (formValues) => !!formValues.goodsId,
      },
    },
    {
      fieldName: 'source',
      label: '来源',
      help: '可选择或输入新来源后选择',
      component: 'Select',
      componentProps: {
        onChange: handleChange,
        maxTagCount: 1,
        options: getDictOptions(DICT_TYPE.MPR_PRICE_REFERENCE_SOURCE, 'string'),
        mode: 'tags',
        placeholder: '请选择来源',
      },
    },
    {
      fieldName: 'currency',
      label: '货币',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MPR_CURRENCY_TYPE, 'string'),
        placeholder: '请选择货币',
      },
    },
    {
      fieldName: 'formattedAmount',
      label: '格式化金额',
      component: 'Input',
      componentProps: {
        placeholder: '请输入格式化金额',
      },
      dependencies: {
        triggerFields: [''],
        if: false,
      },
    },
    {
      fieldName: 'priceInt',
      label: '金额',
      help: '请输入金额数值',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入金额数值',
      },
    },
    {
      fieldName: 'priceWithOffset',
      label: '汇率金额',
      component: 'Input',
      componentProps: {
        placeholder: '请输入汇率金额',
      },
      dependencies: {
        triggerFields: [''],
        if: false,
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'userId',
      label: '用户ID',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入用户ID',
      },
    },
    {
      fieldName: 'goodsId',
      label: 'FB商品ID',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入FB商品ID',
      },
    },
    {
      fieldName: 'source',
      label: '来源',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [],
        placeholder: '请选择来源',
      },
    },
    {
      fieldName: 'currency',
      label: '货币',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [],
        placeholder: '请选择货币',
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PriceReferenceApi.PriceReference>['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: 'ID',
      minWidth: 120,
    },
    {
      field: 'userId',
      title: '用户ID',
      minWidth: 120,
    },
    {
      field: 'goodsId',
      title: 'FB商品ID',
      minWidth: 120,
    },
    {
      field: 'source',
      title: '来源',
      minWidth: 120,
    },
    {
      field: 'currency',
      title: '货币',
      minWidth: 120,
    },
    {
      field: 'formattedAmount',
      title: '格式化金额',
      minWidth: 120,
    },
    {
      field: 'priceInt',
      title: '金额数值',
      minWidth: 120,
    },
    {
      field: 'priceWithOffset',
      title: '汇率金额',
      minWidth: 120,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 120,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/**
 * 详情页字段
 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'goodsId',
      label: 'FB商品ID',
      hidden: true,
    },
    {
      field: 'source',
      label: '来源',
    },
    {
      field: 'currency',
      label: '货币',
    },
    {
      field: 'formattedAmount',
      label: '金额',
    },
    {
      field: 'priceInt',
      label: '金额数值',
      hidden: true,
    },
    {
      field: 'priceWithOffset',
      label: '汇率金额',
      hidden: true,
    },
    {
      field: 'remark',
      label: '备注',
    },
    {
      field: 'createTime',
      label: '添加时间',
      content: (data) => formatDateTime(data?.createTime),
    },
  ];
}
