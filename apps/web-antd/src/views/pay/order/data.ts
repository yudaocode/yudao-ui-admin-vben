import type { FormSchemaGetter } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DICT_TYPE, getDictOptions } from '#/utils/dict';

export const querySchema: FormSchemaGetter = () => [
  {
    component: 'Input',
    fieldName: 'appId',
    label: '应用编号',
    componentProps: {
      placeholder: '请输入应用编号',
    },
  },
  {
    component: 'Select',
    fieldName: 'channelCode',
    label: '支付渠道',
    componentProps: {
      placeholder: '请选择开启状态',
      options: getDictOptions(DICT_TYPE.PAY_CHANNEL_CODE, 'string'),
    },
  },
  {
    component: 'Input',
    fieldName: 'merchantOrderId',
    label: '商户单号',
    componentProps: {
      placeholder: '请输入商户单号',
    },
  },
  {
    component: 'Input',
    fieldName: 'no',
    label: '支付单号',
    componentProps: {
      placeholder: '请输入支付单号',
    },
  },
  {
    component: 'Input',
    fieldName: 'channelOrderNo',
    label: '渠道单号',
    componentProps: {
      placeholder: '请输入渠道单号',
    },
  },
  {
    component: 'Select',
    fieldName: 'status',
    label: '支付状态',
    componentProps: {
      placeholder: '请选择支付状态',
      options: getDictOptions(DICT_TYPE.PAY_ORDER_STATUS, 'number'),
    },
  },
  {
    component: 'RangePicker',
    fieldName: 'createTime',
    label: '创建时间',
    componentProps: {
      placeholder: ['开始日期', '结束日期'],
    },
  },
];

export const columns: VxeGridProps['columns'] = [
  { type: 'checkbox', width: 60 },
  {
    title: '编号',
    field: 'id',
  },
  {
    title: '支付金额',
    field: 'price',
    slots: {
      default: ({ row }) => {
        return `￥${(row.price || 0 / 100).toFixed(2)}`;
      },
    },
  },
  {
    title: '退款金额',
    field: 'refundPrice',
    slots: {
      default: ({ row }) => {
        return `￥${(row.refundPrice || 0 / 100).toFixed(2)}`;
      },
    },
  },
  {
    title: '手续金额',
    field: 'channelFeePrice',
    slots: {
      default: ({ row }) => {
        return `￥${(row.channelFeePrice || 0 / 100).toFixed(2)}`;
      },
    },
  },
  {
    title: '订单号',
    field: 'no',
    slots: {
      default: 'no',
    },
  },
  {
    title: '支付状态',
    field: 'status',
    cellRender: {
      name: 'CellDict',
      props: { type: DICT_TYPE.PAY_ORDER_STATUS },
    },
  },
  {
    title: '支付渠道',
    field: 'channelCode',
    cellRender: {
      name: 'CellDict',
      props: { type: DICT_TYPE.PAY_CHANNEL_CODE },
    },
  },
  {
    title: '支付时间',
    field: 'successTime',
    minWidth: 180,
    formatter: 'formatDateTime',
  },
  {
    title: '支付应用',
    field: 'appName',
  },
  {
    title: '商品标题',
    field: 'subject',
  },
  {
    field: 'action',
    fixed: 'right',
    slots: { default: 'action' },
    title: '操作',
    minWidth: 80,
  },
];
