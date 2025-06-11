import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { erpPriceInputFormatter, formatDateTime } from '@vben/utils';

import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

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
      title: '客户名称',
      field: 'customerName',
      minWidth: 150,
    },
    {
      title: '合同编号',
      field: 'contractNo',
      minWidth: 150,
    },
    {
      title: '期数',
      field: 'period',
      minWidth: 150,
    },
    {
      title: '计划回款(元)',
      field: 'price',
      minWidth: 150,
      formatter: 'formatAmount2',
    },
    {
      title: '计划回款日期',
      field: 'returnTime',
      minWidth: 150,
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
      minWidth: 150,
      formatter: 'formatDateTime',
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
      title: '操作',
      field: 'actions',
      width: 240,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
