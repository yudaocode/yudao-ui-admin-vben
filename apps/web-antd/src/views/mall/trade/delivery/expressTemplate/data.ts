import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';

/** 运费设置表格列 */
export function useChargesColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'seq', title: '序号', width: 50 },
    {
      field: 'areaIds',
      title: '区域',
      minWidth: 300,
      slots: { default: 'areaIds' },
    },
    {
      field: 'startCount',
      title: '首件数',
      width: 120,
      slots: { default: 'startCount' },
    },
    {
      field: 'startPrice',
      title: '运费(元)',
      width: 120,
      slots: { default: 'startPrice' },
    },
    {
      field: 'extraCount',
      title: '续件数',
      width: 120,
      slots: { default: 'extraCount' },
    },
    {
      field: 'extraPrice',
      title: '续费(元)',
      width: 120,
      slots: { default: 'extraPrice' },
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 包邮设置表格列 */
export function useFreesColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'seq', title: '序号', width: 50 },
    {
      field: 'areaIds',
      title: '区域',
      minWidth: 300,
      slots: { default: 'areaIds' },
    },
    {
      field: 'freeCount',
      title: '包邮件数',
      width: 120,
      slots: { default: 'freeCount' },
    },
    {
      field: 'freePrice',
      title: '包邮金额(元)',
      width: 120,
      slots: { default: 'freePrice' },
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

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
      label: '模板名称',
      componentProps: {
        placeholder: '请输入模板名称',
      },
      rules: 'required',
      formItemClass: 'col-span-1',
    },
    {
      fieldName: 'chargeMode',
      label: '计费方式',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.EXPRESS_CHARGE_MODE, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(1),
      formItemClass: 'col-span-1',
    },
    {
      fieldName: 'sort',
      label: '显示顺序',
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入显示顺序',
        min: 0,
      },
      rules: 'required',
      formItemClass: 'col-span-1',
    },
    {
      fieldName: 'charges',
      label: '运费设置',
      formItemClass: 'col-span-3',
      dependencies: {
        triggerFields: ['chargeMode'],
        show: () => true,
      },
    },
    {
      fieldName: 'frees',
      label: '包邮设置',
      formItemClass: 'col-span-3',
      dependencies: {
        triggerFields: [''],
        show: () => true,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '模板名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入模板名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'chargeMode',
      label: '计费方式',
      component: 'Select',
      componentProps: {
        placeholder: '请选择计费方式',
        allowClear: true,
        options: getDictOptions(DICT_TYPE.EXPRESS_CHARGE_MODE, 'number'),
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
      minWidth: 100,
    },
    {
      field: 'name',
      title: '模板名称',
      minWidth: 200,
    },
    {
      field: 'chargeMode',
      title: '计费方式',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.EXPRESS_CHARGE_MODE },
      },
    },
    {
      field: 'sort',
      title: '显示顺序',
      minWidth: 100,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
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
