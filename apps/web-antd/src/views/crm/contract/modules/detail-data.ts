import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DescriptionItemSchema } from '#/components/description';

import { h } from 'vue';

import { erpPriceInputFormatter, formatDateTime } from '@vben/utils';

import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';
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
      formatter: 'formatAmount2',
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
      formatter: 'formatAmount2',
    },
    {
      title: '未回款金额（元）',
      field: 'unpaidPrice',
      minWidth: 150,
      formatter: ({ row }) => {
        return erpPriceInputFormatter(
          row.totalPrice - row.totalReceivablePrice,
        );
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
