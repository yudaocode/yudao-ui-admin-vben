import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { formatDateTime } from '@vben/utils';

import { getCustomerSimpleList } from '#/api/crm/customer';
import { DictTag } from '#/components/dict-tag';
import { erpPriceInputFormatter } from '#/utils';
import { DICT_TYPE, getDictOptions } from '#/utils/dict';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
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
      fieldName: 'period',
      label: '期数',
      component: 'Input',
      componentProps: {
        placeholder: '保存时自动生成',
        disabled: true,
      },
    },
    {
      fieldName: 'price',
      label: '计划回款金额',
      component: 'InputNumber',
      rules: 'required',
      componentProps: {
        placeholder: '请输入计划回款金额',
        min: 0,
        precision: 2,
      },
    },
    {
      fieldName: 'returnTime',
      label: '计划回款日期',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        placeholder: '请选择计划回款日期',
      },
    },
    {
      fieldName: 'remindDays',
      label: '提前几天提醒',
      component: 'InputNumber',
      rules: 'required',
      componentProps: {
        placeholder: '请输入提前几天提醒',
        min: 0,
      },
    },
    {
      fieldName: 'returnType',
      label: '回款方式',
      component: 'Select',
      rules: 'required',
      componentProps: {
        options: getDictOptions(DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE, 'number'),
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
    {
      fieldName: 'contractNo',
      label: '合同编号',
      component: 'Input',
      componentProps: {
        placeholder: '请输入合同编号',
      },
    },
  ];
}

export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      title: '客户名称',
      field: 'customerName',
      minWidth: 150,
      fixed: 'left',
      slots: { default: 'customerName' },
    },
    {
      title: '合同编号',
      field: 'contractNo',
      minWidth: 200,
    },
    {
      title: '期数',
      field: 'period',
      minWidth: 150,
      slots: { default: 'period' },
    },
    {
      title: '计划回款金额（元）',
      field: 'price',
      minWidth: 160,
      formatter: 'formatNumber',
    },
    {
      title: '计划回款日期',
      field: 'returnTime',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '提前几天提醒',
      field: 'remindDays',
      minWidth: 150,
    },
    {
      title: '提醒日期',
      field: 'remindTime',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '回款方式',
      field: 'returnType',
      minWidth: 130,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE },
      },
    },
    {
      title: '备注',
      field: 'remark',
      minWidth: 120,
    },
    {
      title: '负责人',
      field: 'ownerUserName',
      minWidth: 120,
    },
    {
      title: '实际回款金额（元）',
      field: 'receivable.price',
      minWidth: 160,
      formatter: 'formatNumber',
    },
    {
      title: '实际回款日期',
      field: 'receivable.returnTime',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '未回款金额（元）',
      field: 'unpaidPrice',
      minWidth: 160,
      formatter: ({ row }) => {
        if (row.receivable) {
          return row.price - row.receivable.price;
        }
        return row.price;
      },
    },
    {
      title: '更新时间',
      field: 'updateTime',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '创建时间',
      field: 'createTime',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '创建人',
      field: 'creatorName',
      minWidth: 100,
    },
    {
      title: '操作',
      field: 'actions',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 详情页的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'customerName',
      label: '客户名称',
    },
    {
      field: 'totalPrice',
      label: '合同金额',
      content: (data) => erpPriceInputFormatter(data.totalPrice),
    },
    {
      field: 'returnTime',
      label: '回款日期',
      content: (data) => formatDateTime(data?.returnTime) as string,
    },
    {
      field: 'price',
      label: '回款金额',
      content: (data) => erpPriceInputFormatter(data.price),
    },
    {
      field: 'ownerUserName',
      label: '负责人',
    },
  ];
}

/** 详情页的基础字段 */
export function useDetailBaseSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'no',
      label: '回款编号',
    },
    {
      field: 'customerName',
      label: '客户名称',
    },
    {
      field: 'contract',
      label: '合同编号',
      content: (data) => data?.contract?.no,
    },
    {
      field: 'returnTime',
      label: '回款日期',
      content: (data) => formatDateTime(data?.returnTime) as string,
    },
    {
      field: 'price',
      label: '回款金额',
      content: (data) => erpPriceInputFormatter(data.price),
    },
    {
      field: 'returnType',
      label: '回款方式',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE,
          value: data?.returnType,
        }),
    },
    {
      field: 'remark',
      label: '备注',
    },
  ];
}

/** 详情列表的字段 */
export function useDetailListColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      title: '回款编号',
      field: 'no',
      minWidth: 150,
      fixed: 'left',
    },
    {
      title: '客户名称',
      field: 'customerName',
      minWidth: 150,
    },
    {
      title: '合同编号',
      field: 'contract',
      minWidth: 150,
    },
    {
      title: '回款日期',
      field: 'returnTime',
      minWidth: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '回款金额（元）',
      field: 'price',
      minWidth: 150,
      formatter: 'formatNumber',
    },
    {
      title: '回款方式',
      field: 'returnType',
      minWidth: 150,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE },
      },
    },
    {
      title: '负责人',
      field: 'ownerUserName',
      minWidth: 150,
    },
    {
      title: '备注',
      field: 'remark',
      minWidth: 150,
    },
    {
      title: '合同金额（元）',
      field: 'contract.totalPrice',
      minWidth: 150,
      formatter: 'formatNumber',
    },
    {
      title: '回款状态',
      field: 'auditStatus',
      minWidth: 100,
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
