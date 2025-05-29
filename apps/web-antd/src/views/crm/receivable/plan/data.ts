import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { getCustomerSimpleList } from '#/api/crm/customer';
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
      width: 150,
      fixed: 'left',
      slots: { default: 'customerName' },
    },
    {
      title: '合同编号',
      field: 'contractNo',
      width: 200,
    },
    {
      title: '期数',
      field: 'period',
      width: 150,
      slots: { default: 'period' },
    },
    {
      title: '计划回款金额（元）',
      field: 'price',
      width: 160,
      formatter: 'formatNumber',
    },
    {
      title: '计划回款日期',
      field: 'returnTime',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '提前几天提醒',
      field: 'remindDays',
      width: 150,
    },
    {
      title: '提醒日期',
      field: 'remindTime',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '回款方式',
      field: 'returnType',
      width: 130,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE },
      },
    },
    {
      title: '备注',
      field: 'remark',
    },
    {
      title: '负责人',
      field: 'ownerUserName',
      width: 120,
    },
    {
      title: '实际回款金额（元）',
      field: 'receivable.price',
      width: 160,
      formatter: 'formatNumber',
    },
    {
      title: '实际回款日期',
      field: 'receivable.returnTime',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '未回款金额（元）',
      field: 'unpaidPrice',
      width: 160,
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
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '创建时间',
      field: 'createTime',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '创建人',
      field: 'creatorName',
      width: 100,
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
