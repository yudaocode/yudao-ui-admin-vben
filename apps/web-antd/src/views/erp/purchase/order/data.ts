import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridPropTypes } from '#/adapter/vxe-table';

import { getProductSimpleList } from '#/api/erp/product/product';
import { getSupplierSimpleList } from '#/api/erp/purchase/supplier';
import { getSimpleUserList } from '#/api/system/user';
import { DICT_TYPE, getDictOptions, getRangePickerDefaultProps } from '#/utils';

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
      },
    },
    {
      fieldName: 'productId',
      label: '产品',
      component: 'ApiSelect',
      componentProps: {
        api: getProductSimpleList,
        fieldNames: {
          label: 'name',
          value: 'id',
        },
        placeholder: '请选择产品',
        allowClear: true,
        showSearch: true,
      },
    },
    {
      fieldName: 'orderTime',
      label: '订单时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
    {
      fieldName: 'supplierId',
      label: '供应商',
      component: 'ApiSelect',
      componentProps: {
        api: getSupplierSimpleList,
        fieldNames: {
          label: 'name',
          value: 'id',
        },
        placeholder: '请选择供应商',
        allowClear: true,
        showSearch: true,
      },
    },
    {
      fieldName: 'creator',
      label: '创建人',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        fieldNames: {
          label: 'nickname',
          value: 'id',
        },
        placeholder: '请选择创建人',
        allowClear: true,
        showSearch: true,
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
      fieldName: 'remark',
      label: '备注',
      component: 'Input',
      componentProps: {
        placeholder: '请输入备注',
        allowClear: true,
      },
    },
    {
      fieldName: 'inStatus',
      label: '入库状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '未入库', value: 0 },
          { label: '部分入库', value: 1 },
          { label: '全部入库', value: 2 },
        ],
        placeholder: '请选择入库状态',
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

/** 表格列配置 */
export function useGridColumns(): VxeGridPropTypes.Columns {
  return [
    {
      type: 'checkbox',
      width: 60,
      fixed: 'left',
    },
    {
      field: 'no',
      title: '订单单号',
      fixed: 'left',
      minWidth: 180,
    },
    {
      field: 'productNames',
      title: '产品信息',
      minWidth: 200,
    },
    {
      field: 'supplierName',
      title: '供应商',
      minWidth: 120,
    },
    {
      field: 'orderTime',
      title: '订单时间',
      formatter: 'formatDateTime',
      minWidth: 160,
    },
    {
      field: 'creatorName',
      title: '创建人',
      minWidth: 100,
    },
    {
      field: 'totalCount',
      title: '总数量',
      minWidth: 100,
    },
    {
      field: 'inCount',
      title: '入库数量',
      minWidth: 100,
    },
    {
      field: 'returnCount',
      title: '退货数量',
      minWidth: 100,
    },
    {
      field: 'totalProductPrice',
      title: '金额合计',
      formatter: 'formatAmount2',
      minWidth: 120,
    },
    {
      field: 'totalPrice',
      title: '含税金额',
      formatter: 'formatAmount2',
      minWidth: 120,
    },
    {
      field: 'depositPrice',
      title: '支付订金',
      formatter: 'formatAmount2',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.ERP_AUDIT_STATUS },
      },
      minWidth: 100,
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
