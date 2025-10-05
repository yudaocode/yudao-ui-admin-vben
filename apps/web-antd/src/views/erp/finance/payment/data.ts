import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { erpPriceInputFormatter } from '@vben/utils';

import { getAccountSimpleList } from '#/api/erp/finance/account';
import { getSupplierSimpleList } from '#/api/erp/purchase/supplier';
import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';

/** 表单的配置项 */
export function useFormSchema(formType: string): VbenFormSchema[] {
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
      fieldName: 'no',
      label: '付款单号',
      component: 'Input',
      componentProps: {
        placeholder: '系统自动生成',
        disabled: true,
      },
    },
    {
      fieldName: 'paymentTime',
      label: '付款时间',
      component: 'DatePicker',
      componentProps: {
        disabled: formType === 'detail',
        placeholder: '选择付款时间',
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'supplierId',
      label: '供应商',
      component: 'ApiSelect',
      componentProps: {
        disabled: formType === 'detail',
        placeholder: '请选择供应商',
        allowClear: true,
        showSearch: true,
        api: getSupplierSimpleList,
        fieldNames: {
          label: 'name',
          value: 'id',
        },
      },
      rules: 'required',
    },
    {
      fieldName: 'financeUserId',
      label: '财务人员',
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择财务人员',
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
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        autoSize: { minRows: 1, maxRows: 1 },
        disabled: formType === 'detail',
      },
      formItemClass: 'col-span-2',
    },
    {
      fieldName: 'fileUrl',
      label: '附件',
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
        showDescription: formType !== 'detail',
        disabled: formType === 'detail',
      },
      formItemClass: 'col-span-3',
    },
    {
      fieldName: 'items',
      label: '采购入库、退货单',
      component: 'Input',
      formItemClass: 'col-span-3',
    },
    {
      fieldName: 'accountId',
      label: '付款账户',
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择付款账户',
        allowClear: true,
        showSearch: true,
        api: getAccountSimpleList,
        fieldNames: {
          label: 'name',
          value: 'id',
        },
      },
    },
    {
      fieldName: 'totalPrice',
      label: '合计付款',
      component: 'InputNumber',
      componentProps: {
        placeholder: '合计付款',
        precision: 2,
        formatter: erpPriceInputFormatter,
        disabled: true,
      },
    },
    {
      fieldName: 'discountPrice',
      label: '优惠金额',
      component: 'InputNumber',
      componentProps: {
        disabled: formType === 'detail',
        placeholder: '请输入优惠金额',
        precision: 2,
        formatter: erpPriceInputFormatter,
      },
    },
    {
      fieldName: 'paymentPrice',
      label: '实际付款',
      component: 'InputNumber',
      componentProps: {
        placeholder: '实际付款',
        precision: 2,
        formatter: erpPriceInputFormatter,
        disabled: true,
      },
      dependencies: {
        triggerFields: ['totalPrice', 'discountPrice'],
        componentProps: (values) => {
          const totalPrice = values.totalPrice || 0;
          const discountPrice = values.discountPrice || 0;
          values.paymentPrice = totalPrice - discountPrice;
          return {};
        },
      },
    },
  ];
}

/** 表单的明细表格列 */
export function useFormItemColumns(
  formData?: any[],
): VxeTableGridOptions['columns'] {
  return [
    { type: 'seq', title: '序号', minWidth: 50, fixed: 'left' },
    {
      field: 'bizNo',
      title: '采购单据编号',
      minWidth: 200,
    },
    {
      field: 'totalPrice',
      title: '应付金额',
      minWidth: 100,
      formatter: 'formatAmount2',
    },
    {
      field: 'paidPrice',
      title: '已付金额',
      minWidth: 100,
      formatter: 'formatAmount2',
    },
    {
      field: 'paymentPrice',
      title: '本次付款',
      minWidth: 115,
      fixed: 'right',
      slots: { default: 'paymentPrice' },
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
      label: '付款单号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入付款单号',
        allowClear: true,
      },
    },
    {
      fieldName: 'paymentTime',
      label: '付款时间',
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
      fieldName: 'financeUserId',
      label: '财务人员',
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择财务人员',
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
      fieldName: 'accountId',
      label: '付款账户',
      component: 'ApiSelect',
      componentProps: {
        placeholder: '请选择付款账户',
        allowClear: true,
        showSearch: true,
        api: getAccountSimpleList,
        fieldNames: {
          label: 'name',
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
      fieldName: 'remark',
      label: '备注',
      component: 'Input',
      componentProps: {
        placeholder: '请输入备注',
        allowClear: true,
      },
    },
    {
      fieldName: 'bizNo',
      label: '采购单号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入采购单号',
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
      title: '付款单号',
      width: 180,
      fixed: 'left',
    },
    {
      field: 'supplierName',
      title: '供应商',
      minWidth: 120,
    },
    {
      field: 'paymentTime',
      title: '付款时间',
      width: 160,
      formatter: 'formatDate',
    },
    {
      field: 'creatorName',
      title: '创建人',
      minWidth: 120,
    },
    {
      field: 'financeUserName',
      title: '财务人员',
      minWidth: 120,
    },
    {
      field: 'accountName',
      title: '付款账户',
      minWidth: 120,
    },
    {
      field: 'totalPrice',
      title: '合计付款',
      formatter: 'formatAmount2',
      minWidth: 120,
    },
    {
      field: 'discountPrice',
      title: '优惠金额',
      formatter: 'formatAmount2',
      minWidth: 120,
    },
    {
      field: 'paymentPrice',
      title: '实际付款',
      formatter: 'formatAmount2',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 90,
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
