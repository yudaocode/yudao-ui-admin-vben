import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { getCustomerSimpleList } from '#/api/crm/customer';
import { DICT_TYPE } from '#/utils/dict';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '回款编号',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入回款编号',
      },
    },
    {
      fieldName: 'customerId',
      label: '客户',
      component: 'ApiSelect',
      rules: 'required',
      componentProps: {
        api: getCustomerSimpleList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择客户',
      },
    },
    {
      fieldName: 'contractId',
      label: '合同',
      component: 'ApiSelect',
      rules: 'required',
      componentProps: {
        api: getCustomerSimpleList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择合同',
      },
    },
    {
      fieldName: 'returnTime',
      label: '回款日期',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        placeholder: '请选择回款日期',
      },
    },
    {
      fieldName: 'price',
      label: '回款金额',
      component: 'InputNumber',
      rules: 'required',
      componentProps: {
        placeholder: '请输入回款金额',
        min: 0,
        precision: 2,
      },
    },
    {
      fieldName: 'returnType',
      label: '回款方式',
      component: 'DictSelect',
      rules: 'required',
      componentProps: {
        type: DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE,
        placeholder: '请选择回款方式',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
        rows: 4,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '回款编号',
      component: 'Input',
    },
    {
      fieldName: 'customerId',
      label: '客户',
      component: 'ApiSelect',
      componentProps: {
        api: getCustomerSimpleList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择客户',
      },
    },
  ];
}

export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      title: '回款编号',
      field: 'no',
      width: 150,
      fixed: 'left',
      slots: { default: 'no' },
    },
    {
      title: '客户名称',
      field: 'customerName',
      width: 150,
      slots: { default: 'customerName' },
    },
    {
      title: '合同编号',
      field: 'contract',
      width: 150,
      slots: { default: 'contractNo' },
    },
    {
      title: '回款日期',
      field: 'returnTime',
      width: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '回款金额（元）',
      field: 'price',
      width: 150,
      formatter: 'formatNumber',
    },
    {
      title: '回款方式',
      field: 'returnType',
      width: 150,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE },
      },
    },
    {
      title: '备注',
      field: 'remark',
      width: 150,
    },
    {
      title: '合同金额（元）',
      field: 'contract.totalPrice',
      width: 150,
      formatter: 'formatNumber',
    },
    {
      title: '负责人',
      field: 'ownerUserName',
      width: 150,
    },
    {
      title: '所属部门',
      field: 'ownerUserDeptName',
      width: 150,
    },
    {
      title: '更新时间',
      field: 'updateTime',
      width: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '创建时间',
      field: 'createTime',
      width: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '创建人',
      field: 'creatorName',
      width: 150,
    },
    {
      title: '回款状态',
      field: 'auditStatus',
      width: 100,
      fixed: 'right',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_AUDIT_STATUS },
      },
    },
    {
      title: '操作',
      field: 'actions',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
