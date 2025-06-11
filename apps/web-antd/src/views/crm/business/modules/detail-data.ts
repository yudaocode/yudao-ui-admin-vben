import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { erpPriceInputFormatter, formatDateTime } from '@vben/utils';

/** 详情页的字段 */
export function useDetailSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'customerName',
      label: '客户名称',
    },
    {
      field: 'totalPrice',
      label: '商机金额（元）',
      content: (data) => erpPriceInputFormatter(data.totalPrice),
    },
    {
      field: 'statusTypeName',
      label: '商机组',
    },
    {
      field: 'ownerUserName',
      label: '负责人',
    },
    {
      field: 'createTime',
      label: '创建时间',
      content: (data) => formatDateTime(data?.createTime) as string,
    },
  ];
}

/** 详情页的基础字段 */
export function useDetailBaseSchema(): DescriptionItemSchema[] {
  return [
    {
      field: 'name',
      label: '商机名称',
    },
    {
      field: 'customerName',
      label: '客户名称',
    },
    {
      field: 'totalPrice',
      label: '商机金额（元）',
      content: (data) => erpPriceInputFormatter(data.totalPrice),
    },
    {
      field: 'dealTime',
      label: '预计成交日期',
      content: (data) => formatDateTime(data?.dealTime) as string,
    },
    {
      field: 'contactNextTime',
      label: '下次联系时间',
      content: (data) => formatDateTime(data?.contactNextTime) as string,
    },
    {
      field: 'statusTypeName',
      label: '商机状态组',
    },
    {
      field: 'statusName',
      label: '商机阶段',
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
      type: 'checkbox',
      width: 50,
      fixed: 'left',
    },
    {
      field: 'name',
      title: '商机名称',
      fixed: 'left',
      slots: { default: 'name' },
    },
    {
      field: 'customerName',
      title: '客户名称',
      fixed: 'left',
      slots: { default: 'customerName' },
    },
    {
      field: 'totalPrice',
      title: '商机金额（元）',
      formatter: 'formatAmount2',
    },
    {
      field: 'dealTime',
      title: '预计成交日期',
      formatter: 'formatDate',
    },
    {
      field: 'ownerUserName',
      title: '负责人',
    },
    {
      field: 'ownerUserDeptName',
      title: '所属部门',
    },
    {
      field: 'statusTypeName',
      title: '商机状态组',
      fixed: 'right',
    },
    {
      field: 'statusName',
      title: '商机阶段',
      fixed: 'right',
    },
  ];
}
