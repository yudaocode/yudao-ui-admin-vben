import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { erpPriceInputFormatter } from '@vben/utils';

import { z } from '#/adapter/form';
import { getAccountSimpleList } from '#/api/erp/finance/account';
import { getProductSimpleList } from '#/api/erp/product/product';
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
      label: '订单单号',
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
      rules: 'required',
    },
    {
      component: 'DatePicker',
      componentProps: {
        placeholder: '选择订单时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        style: { width: '100%' },
      },
      fieldName: 'orderTime',
      label: '订单时间',
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
    {
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入优惠率',
        min: 0,
        max: 100,
        precision: 2,
        style: { width: '100%' },
      },
      fieldName: 'discountPercent',
      label: '优惠率(%)',
      rules: z.number().min(0).optional(),
    },
    {
      component: 'InputNumber',
      componentProps: {
        placeholder: '付款优惠',
        precision: 2,
        formatter: erpPriceInputFormatter,
        disabled: true,
        style: { width: '100%' },
      },
      fieldName: 'discountPrice',
      label: '付款优惠',
    },
    {
      component: 'InputNumber',
      componentProps: {
        placeholder: '优惠后金额',
        precision: 2,
        formatter: erpPriceInputFormatter,
        disabled: true,
        style: { width: '100%' },
      },
      fieldName: 'totalPrice',
      label: '优惠后金额',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择结算账户',
        allowClear: true,
        showSearch: true,
        api: getAccountSimpleList,
        fieldNames: {
          label: 'name',
          value: 'id',
        },
      },
      fieldName: 'accountId',
      label: '结算账户',
    },
    {
      component: 'InputNumber',
      componentProps: {
        placeholder: '请输入支付订金',
        precision: 2,
        style: { width: '100%' },
        min: 0,
      },
      fieldName: 'depositPrice',
      label: '支付订金',
      rules: z.number().min(0).optional(),
    },
  ];
}

/** 采购订单项表格列定义 */
export function usePurchaseOrderItemTableColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'seq', title: '序号', minWidth: 50, fixed: 'left' },
    {
      field: 'productId',
      title: '产品名称',
      minWidth: 200,
      slots: { default: 'productId' },
    },
    {
      field: 'stockCount',
      title: '库存',
      minWidth: 80,
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
    },
    {
      field: 'productPrice',
      title: '产品单价',
      minWidth: 120,
      slots: { default: 'productPrice' },
    },
    {
      field: 'totalProductPrice',
      title: '金额',
      minWidth: 120,
      formatter: 'formatAmount2',
    },
    {
      field: 'taxPercent',
      title: '税率(%)',
      minWidth: 100,
      slots: { default: 'taxPercent' },
    },
    {
      field: 'taxPrice',
      title: '税额',
      minWidth: 120,
      formatter: 'formatAmount2',
    },
    {
      field: 'totalPrice',
      title: '税额合计',
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
      label: '订单单号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入订单单号',
        allowClear: true,
        disabled: true,
      },
    },
    {
      fieldName: 'productId',
      label: '产品',
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择产品',
        allowClear: true,
        showSearch: true,
        api: getProductSimpleList,
        fieldNames: {
          label: 'name',
          value: 'id',
        },
      },
    },
    {
      fieldName: 'orderTime',
      label: '订单时间',
      component: 'RangePicker',
      componentProps: {
        placeholder: ['开始时间', '结束时间'],
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
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
        fieldNames: {
          label: 'name',
          value: 'id',
        },
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
        fieldNames: {
          label: 'nickname',
          value: 'id',
        },
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.ERP_AUDIT_STATUS, 'number'),
        placeholder: '请选择状态',
        allowClear: true,
      },
    },
    {
      fieldName: 'returnStatus',
      label: '退货状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '未退货', value: 0 },
          { label: '部分退货', value: 1 },
          { label: '全部退货', value: 2 },
        ],
        placeholder: '请选择退货状态',
        allowClear: true,
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
      title: '订单单号',
      width: 200,
      fixed: 'left',
    },
    {
      field: 'productNames',
      title: '产品信息',
      showOverflow: 'tooltip',
      minWidth: 120,
    },
    {
      field: 'supplierName',
      title: '供应商',
      minWidth: 120,
    },
    {
      field: 'orderTime',
      title: '订单时间',
      width: 160,
      formatter: 'formatDateTime',
    },
    {
      field: 'creatorName',
      title: '创建人',
      minWidth: 120,
    },
    {
      field: 'totalCount',
      title: '总数量',
      minWidth: 120,
    },
    {
      field: 'inCount',
      title: '入库数量',
      minWidth: 120,
    },
    {
      field: 'returnCount',
      title: '退货数量',
      minWidth: 120,
    },
    {
      field: 'totalProductPrice',
      title: '金额合计',
      formatter: 'formatNumber',
      minWidth: 120,
    },
    {
      field: 'totalPrice',
      title: '含税金额',
      formatter: 'formatNumber',
      minWidth: 120,
    },
    {
      field: 'depositPrice',
      title: '支付订金',
      formatter: 'formatNumber',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.ERP_AUDIT_STATUS },
      },
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
