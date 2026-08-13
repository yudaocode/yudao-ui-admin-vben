import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsCurrencyApi } from '#/api/fms/config/currency';

import { DICT_TYPE } from '@vben/constants';

import { z } from '#/adapter/form';
import { formatExchangeRate } from '#/views/fms/utils/format';

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<FmsCurrencyApi.Currency>['columns'] {
  return [
    { field: 'code', title: '币别编码', minWidth: 160 },
    { field: 'name', title: '币别名称', minWidth: 220 },
    {
      field: 'exchangeRate',
      title: '汇率',
      minWidth: 180,
      align: 'right',
      formatter: ({ cellValue }) => formatExchangeRate(cellValue),
    },
    {
      field: 'standard',
      title: '本位币',
      width: 130,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.INFRA_BOOLEAN_STRING },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      align: 'center',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}

/** 新增/修改表单 */
export function useFormSchema(
  isStandardCurrency: () => boolean,
): VbenFormSchema[] {
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
      fieldName: 'accountSetId',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'standard',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'code',
      label: '币别编码',
      component: 'Input',
      rules: z
        .string()
        .min(1, { message: '币别编码不能为空' })
        .regex(/^[A-Za-z][A-Za-z0-9_]*$/, {
          message: '币别编码必须以字母开头，只能包含字母、数字和下划线',
        }),
      dependencies: {
        triggerFields: ['standard'],
        disabled: (values) => !!values.standard,
      },
      componentProps: {
        placeholder: '请输入币别编码，如 USD',
        maxlength: 64,
        allowClear: true,
      },
    },
    {
      fieldName: 'name',
      label: '币别名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入币别名称',
        maxlength: 255,
        allowClear: true,
      },
    },
    {
      fieldName: 'exchangeRate',
      label: '汇率',
      component: 'InputNumber',
      rules: z
        .number({ message: '汇率不能为空' })
        .min(0.000001, { message: '汇率不能小于 0.000001' })
        .max(999_999_999_999.999999, {
          message: '汇率不能大于 999999999999.999999',
        })
        .default(1),
      description: () =>
        isStandardCurrency()
          ? '本位币汇率固定为 1'
          : '按 1 单位外币折算本位币填写',
      dependencies: {
        triggerFields: ['standard'],
        disabled: (values) => !!values.standard,
      },
      componentProps: {
        min: 0.000001,
        max: 999_999_999_999.999999,
        precision: 6,
        step: 0.01,
        class: 'w-full',
      },
    },
  ];
}
