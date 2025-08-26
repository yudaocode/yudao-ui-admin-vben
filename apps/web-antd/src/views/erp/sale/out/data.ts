import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { erpNumberFormatter, erpPriceInputFormatter } from '@vben/utils';

import { z } from '#/adapter/form';
import { getAccountSimpleList } from '#/api/erp/finance/account';
import { getProductSimpleList } from '#/api/erp/product/product';
import { getCustomerSimpleList } from '#/api/erp/sale/customer';
import { getWarehouseSimpleList } from '#/api/erp/stock/warehouse';
import { getSimpleUserList } from '#/api/system/user';
import { DICT_TYPE, getDictOptions } from '#/utils';

/** 表单的配置项 */
export function useFormSchema(formType: string): VbenFormSchema[] {
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
      label: '出库单号',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        disabled: true,
        placeholder: '请选择客户',
        allowClear: true,
        showSearch: true,
        api: getCustomerSimpleList,
        fieldNames: {
          label: 'name',
          value: 'id',
        },
      },
      fieldName: 'customerId',
      label: '客户',
      rules: 'required',
    },
    {
      fieldName: 'orderNo',
      label: '关联订单',
      component: 'Input',
      formItemClass: 'col-span-1',
      rules: 'required',
      componentProps: {
        placeholder: '请选择关联订单',
        disabled: formType === 'detail',
      },
    },
    {
      component: 'DatePicker',
      componentProps: {
        disabled: formType === 'detail',
        placeholder: '选择出库时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
        style: { width: '100%' },
      },
      fieldName: 'outTime',
      label: '出库时间',
      rules: 'required',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        disabled: formType === 'detail',
        autoSize: { minRows: 1, maxRows: 1 },
        class: 'w-full',
      },
      fieldName: 'remark',
      formItemClass: 'col-span-2',
      label: '备注',
    },
    {
      component: 'FileUpload',
      componentProps: {
        disabled: formType === 'detail',
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
      fieldName: 'discountPercent',
      componentProps: {
        placeholder: '优惠率',
        min: 0,
        max: 100,
        disabled: true,
        precision: 2,
        style: { width: '100%' },
      },

      label: '优惠率(%)',
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
      fieldName: 'discountedPrice',
      label: '优惠后金额',
    },
    {
      component: 'InputNumber',
      componentProps: {
        disabled: formType === 'detail',
        placeholder: '请输入其他费用',
        precision: 2,
        formatter: erpPriceInputFormatter,
        style: { width: '100%' },
      },
      fieldName: 'otherPrice',
      label: '其他费用',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择结算账户',
        disabled: true,
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
        precision: 2,
        style: { width: '100%' },
        disabled: true,
        min: 0,
      },
      fieldName: 'totalPrice',
      label: '应收金额',
      rules: z.number().min(0).optional(),
    },
  ];
}

/** 采购订单项表格列定义 */
export function useSaleOutItemTableColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'seq', title: '序号', minWidth: 50, fixed: 'left' },
    {
      field: 'warehouseId',
      title: '仓库名称',
      minWidth: 200,
      slots: { default: 'warehouseId' },
    },
    {
      field: 'productId',
      title: '产品名称',
      minWidth: 200,
      slots: { default: 'productId' },
    },
    {
      field: 'stockCount',
      title: '仓库库存',
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
      field: 'totalCount',
      title: '原数量',
      minWidth: 120,
    },
    {
      field: 'outCount',
      title: '已出库数量',
      minWidth: 120,
    },
    {
      field: 'count',
      title: '数量',
      minWidth: 120,
      fixed: 'right',
      slots: { default: 'count' },
    },
    {
      field: 'productPrice',
      title: '产品单价',
      fixed: 'right',
      minWidth: 120,
      slots: { default: 'productPrice' },
    },
    {
      field: 'totalProductPrice',
      fixed: 'right',
      title: '产品金额',
      minWidth: 120,
      formatter: 'formatAmount2',
    },
    {
      fixed: 'right',
      field: 'taxPercent',
      title: '税率(%)',
      minWidth: 100,
    },
    {
      fixed: 'right',
      field: 'taxPrice',
      title: '税额',
      minWidth: 120,
      formatter: 'formatAmount2',
    },
    {
      field: 'totalPrice',
      fixed: 'right',
      title: '合计金额',
      minWidth: 120,
      formatter: 'formatAmount2',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '出库单号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入出库单号',
        allowClear: true,
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
      fieldName: 'outTime',
      label: '出库时间',
      component: 'RangePicker',
      componentProps: {
        placeholder: ['开始时间', '结束时间'],
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
    },
    {
      fieldName: 'customerId',
      label: '客户',
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择客户',
        allowClear: true,
        showSearch: true,
        api: getCustomerSimpleList,
        fieldNames: {
          label: 'name',
          value: 'id',
        },
      },
    },
    {
      fieldName: 'warehouseId',
      label: '仓库',
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择仓库',
        allowClear: true,
        showSearch: true,
        api: getWarehouseSimpleList,
        labelField: 'name',
        valueField: 'id',
        filterOption: false,
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
      fieldName: 'orderNo',
      label: '关联订单',
      component: 'Input',
      componentProps: {
        placeholder: '请输入关联订单号',
        allowClear: true,
      },
    },
    {
      fieldName: 'receiptStatus',
      label: '收款状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '未收款', value: 0 },
          { label: '部分收款', value: 1 },
          { label: '全部收款', value: 2 },
        ],
        placeholder: '请选择收款状态',
        allowClear: true,
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
      title: '出库单号',
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
      field: 'customerName',
      title: '客户',
      minWidth: 120,
    },
    {
      field: 'outTime',
      title: '出库时间',
      width: 160,
      formatter: 'formatDate',
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
      field: 'totalPrice',
      title: '应收金额',
      formatter: 'formatNumber',
      minWidth: 120,
    },
    {
      field: 'receiptPrice',
      title: '已收金额',
      formatter: 'formatNumber',
      minWidth: 120,
    },
    {
      field: 'unReceiptPrice',
      title: '未收金额',
      formatter: ({ row }) => {
        return `${erpNumberFormatter(row.totalPrice - row.receiptPrice, 2)}元`;
      },
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
      minWidth: 250,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
/** 列表的搜索表单 */
export function useOrderGridFormSchema(): VbenFormSchema[] {
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
  ];
}

/** 列表的字段 */
export function useOrderGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      type: 'radio',
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
      field: 'customerName',
      title: '客户',
      minWidth: 120,
    },
    {
      field: 'orderTime',
      title: '订单时间',
      width: 160,
      formatter: 'formatDate',
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
      field: 'outCount',
      title: '出库数量',
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
  ];
}
