import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { DICT_TYPE } from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'subject',
      label: '提现标题',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      fieldName: 'price',
      label: '提现金额',
      rules: 'required',
      componentProps: {
        min: 1,
        precision: 2,
        step: 0.01,
      },
    },
    {
      component: 'Select',
      fieldName: 'type',
      label: '提现类型',
      rules: 'required',
      componentProps: {
        options: [
          { label: '支付宝', value: 1 },
          { label: '微信余额', value: 2 },
          { label: '钱包余额', value: 3 },
        ],
      },
    },
    {
      component: 'Input',
      fieldName: 'userName',
      label: '收款人姓名',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'userAccount',
      label: '收款人账号',
      rules: 'required',
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '提现单编号',
      minWidth: 100,
    },
    {
      field: 'subject',
      title: '提现标题',
      minWidth: 120,
    },
    {
      field: 'type',
      title: '提现类型',
      minWidth: 90,
      slots: { default: 'type' },
    },
    {
      field: 'price',
      title: '提现金额',
      minWidth: 120,
      formatter: 'formatNumber',
    },
    {
      field: 'userName',
      title: '收款人姓名',
      minWidth: 150,
    },
    {
      field: 'userAccount',
      title: '收款人账号',
      minWidth: 250,
    },
    {
      field: 'status',
      title: '提现状态',
      minWidth: 100,
      slots: { default: 'status' },
    },
    {
      field: 'payTransferId',
      title: '转账单号',
      minWidth: 120,
    },
    {
      field: 'transferChannelCode',
      title: '转账渠道',
      minWidth: 180,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PAY_CHANNEL_CODE },
      },
    },
    {
      field: 'transferTime',
      title: '转账时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'transferErrorMsg',
      title: '转账失败原因',
      minWidth: 200,
    },
    {
      title: '操作',
      width: 130,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
