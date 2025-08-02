import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { createRequiredValidation } from '#/adapter/vxe-table';
import { getSupplierSimpleList } from '#/api/erp/purchase/supplier';
import { getSimpleUserList } from '#/api/system/user';
import { DICT_TYPE, getDictOptions } from '#/utils';

/** 表单的配置项 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        style: { display: 'none' },
      },
      fieldName: 'id',
      label: 'ID',
      hideLabel: true,
      formItemClass: 'hidden',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '系统自动生成',
        disabled: true,
      },
      fieldName: 'no',
      label: '入库单号',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择供应商',
        allowClear: true,
        showSearch: true,
        api: getSupplierSimpleList,
        fieldNames: {
          label: 'name',
          value: 'id',
        },
      },
      fieldName: 'supplierId',
      label: '供应商',
    },
    {
      component: 'DatePicker',
      componentProps: {
        placeholder: '选择入库时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        style: { width: '100%' },
      },
      fieldName: 'inTime',
      label: '入库时间',
      rules: 'required',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        autoSize: { minRows: 2, maxRows: 4 },
        class: 'w-full',
      },
      fieldName: 'remark',
      label: '备注',
      formItemClass: 'col-span-3',
    },
    {
      component: 'FileUpload',
      componentProps: {
        maxNumber: 1,
        maxSize: 10,
        accept: [
          'pdf',
          'doc',
          'docx',
          'xls',
          'xlsx',
          'txt',
          'jpg',
          'jpeg',
          'png',
        ],
        showDescription: true,
      },
      fieldName: 'fileUrl',
      label: '附件',
      formItemClass: 'col-span-3',
    },
    {
      fieldName: 'product',
      label: '产品清单',
      component: 'Input',
      formItemClass: 'col-span-3',
    },
  ];
}

/** 入库产品清单表格列定义 */
export function useStockInItemTableColumns(
  isValidating?: any,
): VxeTableGridOptions['columns'] {
  return [
    { type: 'seq', title: '序号', minWidth: 50, fixed: 'left' },
    {
      field: 'warehouseId',
      title: '仓库名称',
      minWidth: 150,
      slots: { default: 'warehouseId' },
      className: createRequiredValidation(isValidating, 'warehouseId'),
    },
    {
      field: 'productId',
      title: '产品名称',
      minWidth: 200,
      slots: { default: 'productId' },
      className: createRequiredValidation(isValidating, 'productId'),
    },
    {
      field: 'stockCount',
      title: '库存',
      minWidth: 100,
    },
    {
      field: 'productBarCode',
      title: '条码',
      minWidth: 120,
    },
    {
      field: 'productUnitName',
      title: '单位',
      minWidth: 80,
    },
    {
      field: 'count',
      title: '数量',
      minWidth: 120,
      slots: { default: 'count' },
      className: createRequiredValidation(isValidating, 'count'),
    },
    {
      field: 'productPrice',
      title: '产品单价',
      minWidth: 120,
      slots: { default: 'productPrice' },
    },
    {
      field: 'totalPrice',
      title: '金额',
      minWidth: 120,
      formatter: 'formatAmount2',
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 150,
      slots: { default: 'remark' },
    },
    {
      title: '操作',
      width: 50,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '入库单号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入入库单号',
        allowClear: true,
      },
    },
    {
      fieldName: 'supplierId',
      label: '供应商',
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择供应商',
        allowClear: true,
        showSearch: true,
        api: getSupplierSimpleList,
        labelField: 'name',
        valueField: 'id',
        filterOption: false,
      },
    },
    {
      fieldName: 'inTime',
      label: '入库时间',
      component: 'RangePicker',
      componentProps: {
        placeholder: ['开始日期', '结束日期'],
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        placeholder: '请选择状态',
        allowClear: true,
        options: getDictOptions(DICT_TYPE.ERP_AUDIT_STATUS, 'number'),
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Input',
      componentProps: {
        placeholder: '请输入备注',
        allowClear: true,
      },
    },
    {
      fieldName: 'creator',
      label: '创建人',
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择创建人',
        allowClear: true,
        showSearch: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        valueField: 'id',
        filterOption: false,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'checkbox',
      width: 50,
      fixed: 'left',
    },
    {
      field: 'no',
      title: '入库单号',
      minWidth: 180,
    },
    {
      field: 'productNames',
      title: '产品信息',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'supplierName',
      title: '供应商',
      minWidth: 120,
    },
    {
      field: 'inTime',
      title: '入库时间',
      minWidth: 180,
      cellRender: {
        name: 'CellDateTime',
      },
    },
    {
      field: 'creatorName',
      title: '创建人',
      minWidth: 100,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 90,
      fixed: 'right',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.ERP_AUDIT_STATUS },
      },
    },
    {
      title: '操作',
      width: 300,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
