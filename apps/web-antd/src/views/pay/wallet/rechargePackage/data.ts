import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { getRangePickerDefaultProps } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '套餐名',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入套餐名称',
      },
    },
    {
      fieldName: 'payPrice',
      label: '支付金额(元)',
      component: 'InputNumber',
      rules: 'required',
      componentProps: {
        min: 0,
        precision: 2,
        step: 0.01,
        placeholder: '请输入支付金额',
      },
    },
    {
      fieldName: 'bonusPrice',
      label: '赠送金额(元)',
      component: 'InputNumber',
      rules: 'required',
      componentProps: {
        min: 0,
        precision: 2,
        step: 0.01,
        placeholder: '请输入赠送金额',
      },
    },
    {
      fieldName: 'status',
      label: '开启状态',
      component: 'RadioGroup',
      rules: 'required',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择开启状态',
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '套餐名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入套餐名称',
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
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        allowClear: true,
        ...getRangePickerDefaultProps(),
        placeholder: ['开始日期', '结束日期'],
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
      field: 'name',
      title: '套餐名称',
    },
    {
      field: 'payPrice',
      title: '支付金额',
      formatter: 'formatAmount2',
    },
    {
      field: 'bonusPrice',
      title: '赠送金额',
      formatter: 'formatAmount2',
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
