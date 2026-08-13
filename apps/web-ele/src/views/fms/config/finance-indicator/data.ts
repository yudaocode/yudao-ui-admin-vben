import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsFinanceIndicatorApi } from '#/api/fms/config/finance-indicator';

import { z } from '@vben/common-ui';
import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<FmsFinanceIndicatorApi.FinanceIndicator>['columns'] {
  return [
    { field: 'name', title: '名称', minWidth: 160 },
    { field: 'code', title: '编码', minWidth: 140 },
    {
      field: 'type',
      title: '取数报表',
      width: 140,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.FMS_FINANCE_INDICATOR_TYPE },
      },
    },
    { field: 'formula', title: '公式', minWidth: 280 },
    { field: 'sort', title: '排序', width: 90 },
    {
      field: 'status',
      title: '状态',
      width: 90,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 新增/修改表单 */
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
      fieldName: 'accountSetId',
      component: 'InputNumber',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '指标名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入指标名称',
        maxlength: 100,
        clearable: true,
      },
    },
    {
      fieldName: 'code',
      label: '指标编码',
      component: 'Input',
      rules: 'required',
      dependencies: {
        triggerFields: ['id'],
        disabled: (values) => !!values.id,
      },
      componentProps: {
        placeholder: '请输入指标编码',
        maxlength: 64,
        clearable: true,
      },
    },
    {
      fieldName: 'type',
      label: '取数报表',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: getDictOptions(DICT_TYPE.FMS_FINANCE_INDICATOR_TYPE, 'number'),
        placeholder: '请选择取数报表',
        clearable: true,
      },
    },
    {
      fieldName: 'formula',
      label: '指标公式',
      component: 'Textarea',
      rules: 'required',
      help: '支持报表行次公式（L1+L2-L3）或报表科目公式 JSON',
      componentProps: {
        placeholder: '例如：L1+L2-L3，或科目公式 JSON',
        maxlength: 2000,
        rows: 4,
        showWordLimit: true,
      },
    },
    {
      fieldName: 'sort',
      label: '排序',
      component: 'InputNumber',
      rules: z.number().min(0, { message: '排序不能小于 0' }).default(10),
      componentProps: {
        placeholder: '请输入排序',
        min: 0,
        class: '!w-full',
        controlsPosition: 'right',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'RadioGroup',
      rules: z.number().default(CommonStatusEnum.ENABLE),
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
    },
  ];
}
