import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { formatDateTime } from '@vben/utils';

import { getSimpleBusinessList } from '#/api/crm/business';
import { getSimpleContactList } from '#/api/crm/contact';
import { getCustomerSimpleList } from '#/api/crm/customer';
import { DictTag } from '#/components/dict-tag';
import { erpPriceInputFormatter, floatToFixed2 } from '#/utils';
import { DICT_TYPE } from '#/utils/dict';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'no',
      label: '合同编号',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入合同编号',
      },
    },
    {
      fieldName: 'name',
      label: '合同名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入合同名称',
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
      fieldName: 'businessId',
      label: '商机',
      component: 'ApiSelect',
      rules: 'required',
      componentProps: {
        api: getSimpleBusinessList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择商机',
      },
    },
    {
      fieldName: 'totalPrice',
      label: '合同金额',
      component: 'InputNumber',
      rules: 'required',
      componentProps: {
        placeholder: '请输入合同金额',
        min: 0,
        precision: 2,
      },
    },
    {
      fieldName: 'orderDate',
      label: '下单时间',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        placeholder: '请选择下单时间',
      },
    },
    {
      fieldName: 'startTime',
      label: '合同开始时间',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        placeholder: '请选择合同开始时间',
      },
    },
    {
      fieldName: 'endTime',
      label: '合同结束时间',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        placeholder: '请选择合同结束时间',
      },
    },
    {
      fieldName: 'signContactId',
      label: '客户签约人',
      component: 'ApiSelect',
      rules: 'required',
      componentProps: {
        api: getSimpleContactList,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择客户签约人',
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
      label: '合同编号',
      component: 'Input',
    },
    {
      fieldName: 'name',
      label: '合同名称',
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
      title: '合同编号',
      field: 'no',
      minWidth: 150,
      fixed: 'left',
    },
    {
      title: '合同名称',
      field: 'name',
      minWidth: 150,
      fixed: 'left',
      slots: { default: 'name' },
    },
    {
      title: '客户名称',
      field: 'customerName',
      minWidth: 150,
      slots: { default: 'customerName' },
    },
    {
      title: '商机名称',
      field: 'businessName',
      minWidth: 150,
      slots: { default: 'businessName' },
    },
    {
      title: '合同金额（元）',
      field: 'totalPrice',
      minWidth: 150,
      formatter: 'formatNumber',
    },
    {
      title: '下单时间',
      field: 'orderDate',
      minWidth: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '合同开始时间',
      field: 'startTime',
      minWidth: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '合同结束时间',
      field: 'endTime',
      minWidth: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '客户签约人',
      field: 'signContactName',
      minWidth: 150,
      slots: { default: 'signContactName' },
    },
    {
      title: '公司签约人',
      field: 'signUserName',
      minWidth: 150,
    },
    {
      title: '已回款金额（元）',
      field: 'totalReceivablePrice',
      minWidth: 150,
      formatter: 'formatNumber',
    },
    {
      title: '未回款金额（元）',
      field: 'unpaidPrice',
      minWidth: 150,
      formatter: ({ row }) => {
        return floatToFixed2(row.totalPrice - row.totalReceivablePrice);
      },
    },
    {
      title: '最后跟进时间',
      field: 'contactLastTime',
      minWidth: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '负责人',
      field: 'ownerUserName',
      minWidth: 150,
    },
    {
      title: '所属部门',
      field: 'ownerUserDeptName',
      minWidth: 150,
    },
    {
      title: '更新时间',
      field: 'updateTime',
      minWidth: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '创建时间',
      field: 'createTime',
      minWidth: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '创建人',
      field: 'creatorName',
      minWidth: 150,
    },
    {
      title: '备注',
      field: 'remark',
      minWidth: 150,
    },
    {
      title: '合同状态',
      field: 'auditStatus',
      fixed: 'right',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_AUDIT_STATUS },
      },
    },
    {
      title: '操作',
      field: 'actions',
      fixed: 'right',
      width: 130,
      slots: { default: 'actions' },
    },
  ];
}

/** 详情头部的配置 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'customerName',
      label: '客户名称',
    },
    {
      field: 'totalPrice',
      label: '合同金额（元）',
      content: (data) => erpPriceInputFormatter(data?.totalPrice) as string,
    },
    {
      field: 'orderDate',
      label: '下单时间',
      content: (data) => formatDateTime(data?.orderDate) as string,
    },
    {
      field: 'totalReceivablePrice',
      label: '回款金额（元）',
      content: (data) =>
        erpPriceInputFormatter(data?.totalReceivablePrice) as string,
    },
    {
      field: 'ownerUserName',
      label: '负责人',
    },
  ];
}

/** 详情基本信息的配置 */
export function useDetailBaseSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'no',
      label: '合同编号',
    },
    {
      field: 'name',
      label: '合同名称',
    },
    {
      field: 'customerName',
      label: '客户名称',
    },
    {
      field: 'businessName',
      label: '商机名称',
    },
    {
      field: 'totalPrice',
      label: '合同金额（元）',
      content: (data) => erpPriceInputFormatter(data?.totalPrice) as string,
    },
    {
      field: 'orderDate',
      label: '下单时间',
      content: (data) => formatDateTime(data?.orderDate) as string,
    },
    {
      field: 'startTime',
      label: '合同开始时间',
      content: (data) => formatDateTime(data?.startTime) as string,
    },
    {
      field: 'endTime',
      label: '合同结束时间',
      content: (data) => formatDateTime(data?.endTime) as string,
    },
    {
      field: 'signContactName',
      label: '客户签约人',
    },
    {
      field: 'signUserName',
      label: '公司签约人',
    },
    {
      field: 'remark',
      label: '备注',
    },
    {
      field: 'auditStatus',
      label: '合同状态',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.CRM_AUDIT_STATUS,
          value: data?.auditStatus,
        }),
    },
  ];
}

export function useDetailListColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      title: '合同编号',
      field: 'no',
      minWidth: 150,
      fixed: 'left',
    },
    {
      title: '合同名称',
      field: 'name',
      minWidth: 150,
      fixed: 'left',
      slots: { default: 'name' },
    },
    {
      title: '合同金额（元）',
      field: 'totalPrice',
      minWidth: 150,
      formatter: 'formatNumber',
    },
    {
      title: '合同开始时间',
      field: 'startTime',
      minWidth: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '合同结束时间',
      field: 'endTime',
      minWidth: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '已回款金额（元）',
      field: 'totalReceivablePrice',
      minWidth: 150,
      formatter: 'formatNumber',
    },
    {
      title: '未回款金额（元）',
      field: 'unpaidPrice',
      minWidth: 150,
      formatter: ({ row }) => {
        return floatToFixed2(row.totalPrice - row.totalReceivablePrice);
      },
    },
    {
      title: '负责人',
      field: 'ownerUserName',
      minWidth: 150,
    },
    {
      title: '所属部门',
      field: 'ownerUserDeptName',
      minWidth: 150,
    },
    {
      title: '创建时间',
      field: 'createTime',
      minWidth: 150,
      formatter: 'formatDateTime',
    },
    {
      title: '创建人',
      field: 'creatorName',
      minWidth: 150,
    },
    {
      title: '备注',
      field: 'remark',
      minWidth: 150,
    },
    {
      title: '合同状态',
      field: 'auditStatus',
      fixed: 'right',
      minWidth: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.CRM_AUDIT_STATUS },
      },
    },
  ];
}
