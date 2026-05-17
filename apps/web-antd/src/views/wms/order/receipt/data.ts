import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';
import { WmsMerchantSelect } from '#/views/wms/md/merchant/components';
import { WmsWarehouseSelect } from '#/views/wms/md/warehouse/components';
import {
  PRICE_PRECISION,
  QUANTITY_PRECISION,
} from '#/views/wms/utils/format';

import NumberRangeInput from './modules/number-range-input.vue';

function splitNumberRange(minFieldName: string, maxFieldName: string) {
  return (
    value: [number | undefined, number | undefined] | undefined,
    setValue: (fieldName: string, value: any) => void,
  ) => {
    setValue(minFieldName, value?.[0]);
    setValue(maxFieldName, value?.[1]);
    return undefined;
  };
}

function buildNumberRangeSchema(
  label: string,
  fieldName: string,
  minFieldName: string,
  maxFieldName: string,
  precision: number,
): VbenFormSchema {
  return {
    component: markRaw(NumberRangeInput),
    componentProps: {
      min: 0,
      precision,
    },
    fieldName,
    label,
    valueFormat: splitNumberRange(minFieldName, maxFieldName),
  };
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入入库单号',
      },
      fieldName: 'no',
      label: '入库单号',
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入业务单号',
      },
      fieldName: 'bizOrderNo',
      label: '业务单号',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.WMS_ORDER_STATUS, 'number'),
        placeholder: '请选择单据状态',
      },
      fieldName: 'status',
      label: '单据状态',
    },
    {
      component: markRaw(WmsWarehouseSelect),
      fieldName: 'warehouseId',
      label: '仓库',
    },
    {
      component: markRaw(WmsMerchantSelect),
      componentProps: {
        placeholder: '请选择供应商',
        supplier: true,
      },
      fieldName: 'merchantId',
      label: '供应商',
    },
    {
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
      fieldName: 'orderTime',
      label: '单据日期',
    },
    buildNumberRangeSchema(
      '数量',
      'totalQuantityRange',
      'totalQuantityMin',
      'totalQuantityMax',
      QUANTITY_PRECISION,
    ),
    buildNumberRangeSchema(
      '总金额',
      'totalPriceRange',
      'totalPriceMin',
      'totalPriceMax',
      PRICE_PRECISION,
    ),
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.WMS_RECEIPT_ORDER_TYPE, 'number'),
        placeholder: '请选择入库类型',
      },
      fieldName: 'type',
      label: '入库类型',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择创建用户',
        showSearch: true,
        valueField: 'id',
      },
      fieldName: 'creator',
      label: '创建用户',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择更新用户',
        showSearch: true,
        valueField: 'id',
      },
      fieldName: 'updater',
      label: '更新用户',
    },
    {
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
      fieldName: 'createTime',
      label: '创建时间',
    },
    {
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
      fieldName: 'updateTime',
      label: '更新时间',
    },
  ];
}

/** 列表表格列 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      fixed: 'left',
      slots: { content: 'expand_content' },
      type: 'expand',
      width: 48,
    },
    {
      field: 'no',
      fixed: 'left',
      slots: { default: 'no' },
      title: '单号/业务单号',
      width: 260,
    },
    {
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.WMS_ORDER_STATUS },
      },
      field: 'status',
      fixed: 'left',
      title: '入库状态',
      width: 110,
    },
    {
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.WMS_RECEIPT_ORDER_TYPE },
      },
      field: 'type',
      title: '入库类型',
      width: 120,
    },
    {
      field: 'warehouseName',
      minWidth: 180,
      title: '仓库',
    },
    {
      field: 'quantityAmount',
      minWidth: 180,
      slots: { default: 'quantityAmount' },
      title: '总数量/总金额(元)',
    },
    {
      field: 'merchantName',
      minWidth: 160,
      title: '供应商',
    },
    {
      field: 'operateInfo',
      minWidth: 260,
      slots: { default: 'operateInfo' },
      title: '操作信息',
    },
    {
      field: 'remark',
      minWidth: 160,
      title: '备注',
    },
    {
      field: 'actions',
      fixed: 'right',
      slots: { default: 'actions' },
      title: '操作',
      width: 220,
    },
  ];
}

/** 表单的配置项 */
export function useFormSchema(
  handleWarehouseChange: () => Promise<void> | void,
): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      dependencies: {
        show: () => false,
        triggerFields: [''],
      },
      fieldName: 'id',
    },
    {
      component: 'Input',
      componentProps: {
        maxLength: 64,
        placeholder: '请输入入库单号',
      },
      fieldName: 'no',
      label: '入库单号',
      rules: z.string().min(1, '入库单号不能为空').max(64),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.WMS_RECEIPT_ORDER_TYPE, 'number'),
        placeholder: '请选择入库类型',
      },
      fieldName: 'type',
      label: '入库类型',
      rules: 'required',
    },
    {
      component: markRaw(WmsWarehouseSelect),
      componentProps: {
        onChange: handleWarehouseChange,
      },
      fieldName: 'warehouseId',
      label: '仓库',
      rules: 'required',
    },
    {
      component: 'DatePicker',
      componentProps: {
        class: 'w-full',
        format: 'YYYY-MM-DD',
        placeholder: '请选择单据日期',
        valueFormat: 'x',
      },
      fieldName: 'orderTime',
      label: '单据日期',
      rules: 'required',
    },
    {
      component: markRaw(WmsMerchantSelect),
      componentProps: {
        placeholder: '请选择供应商',
        supplier: true,
      },
      fieldName: 'merchantId',
      label: '供应商',
    },
    {
      component: 'Input',
      componentProps: {
        maxLength: 64,
        placeholder: '请输入业务单号',
      },
      fieldName: 'bizOrderNo',
      label: '业务单号',
    },
    {
      component: 'Textarea',
      componentProps: {
        maxLength: 255,
        placeholder: '请输入备注',
      },
      fieldName: 'remark',
      formItemClass: 'col-span-2',
      label: '备注',
    },
  ];
}
