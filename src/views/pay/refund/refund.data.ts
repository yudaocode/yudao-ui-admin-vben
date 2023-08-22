import { getAppList } from '@/api/pay/app'
import type { DescItem } from '@/components/Description'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '支付金额(元)',
    dataIndex: 'payPrice',
    width: 120,
    customRender: ({ text }) => {
      return `￥${Number.parseFloat(`${text / 100}`).toFixed(2)}`
    },
  },
  {
    title: '退款金额(元)',
    dataIndex: 'refundPrice',
    width: 120,
    customRender: ({ text }) => {
      return `￥${Number.parseFloat(`${text / 100}`).toFixed(2)}`
    },
  },
  {
    title: '退款订单号',
    children: [
      {
        title: '商户',
        dataIndex: 'merchantRefundId',
        width: 120,
      },
      {
        title: '退款',
        dataIndex: 'no',
        width: 120,
      },
      {
        title: '渠道',
        dataIndex: 'channelRefundNo',
        width: 160,
      },
    ],
  },
  {
    title: '支付订单号',
    children: [
      {
        title: '商户',
        dataIndex: 'merchantOrderId',
        width: 200,
      },
      {
        title: '渠道',
        dataIndex: 'channelOrderNo',
        width: 100,
      },
    ],
  },
  {
    title: '退款状态',
    dataIndex: 'status',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.PAY_REFUND_STATUS)
    },
  },
  {
    title: '退款渠道',
    dataIndex: 'channelCode',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.PAY_CHANNEL_CODE)
    },
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '退款成功时间',
    dataIndex: 'successTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '支付应用',
    dataIndex: 'appName',
    width: 100,
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '应用编号',
    field: 'appId',
    component: 'ApiSelect',
    componentProps: {
      api: () => getAppList(),
      labelField: 'name',
      valueField: 'id',
    },
    colProps: { span: 8 },
  },
  {
    label: '商户支付单号',
    field: 'merchantOrderId',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '商户退款单号',
    field: 'merchantRefundId',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '渠道支付单号',
    field: 'channelOrderNo',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '退款状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.PAY_REFUND_STATUS),
    },
    colProps: { span: 8 },
  },
  {
    label: '创建时间',
    field: 'createTime',
    component: 'RangePicker',
    colProps: { span: 8 },
  },
]

export const descSchema: DescItem[] = [
  {
    label: '商户退款单号',
    field: 'merchantRefundId',
  },
  {
    label: '渠道退款单号',
    field: 'channelRefundNo',
  },
  {
    label: '商户支付单号',
    field: 'merchantOrderId',
  },
  {
    label: '渠道支付单号',
    field: 'channelOrderNo',
    render: (curVal) => {
      return useRender.renderTag(curVal)
    },
  },
  {
    label: '应用编号',
    field: 'appId',
  },
  {
    label: '应用名称',
    field: 'appName',
  },
  {
    label: '支付金额',
    field: 'payPrice',
    render: (curVal) => {
      return `￥${Number.parseFloat(`${curVal / 100}`).toFixed(2)}`
    },
  },
  {
    label: '退款金额',
    field: 'refundPrice',
    render: (curVal) => {
      return `￥${Number.parseFloat(`${curVal / 100}`).toFixed(2)}`
    },
  },
  {
    label: '退款状态',
    field: 'status',
    render: (curVal) => {
      return useRender.renderDict(curVal, DICT_TYPE.PAY_REFUND_STATUS)
    },
  },
  {
    label: '创建时间',
    field: 'createTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    },
  },
  {
    label: '退款成功时间',
    field: 'successTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    },
  },
  {
    label: '更新时间',
    field: 'updateTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    },
  },
  {
    label: '退款渠道',
    field: 'channelCode',
    render: (curVal) => {
      return useRender.renderDict(curVal, DICT_TYPE.PAY_CHANNEL_CODE)
    },
  },
  {
    label: '退款原因',
    field: 'reason',
  },
  {
    label: '退款 IP',
    field: 'userIp',
  },
  {
    label: '退款 URL',
    field: 'notifyUrl',
  },
  {
    label: '渠道错误码',
    field: 'channelErrorCode',
  },
  {
    label: '渠道错误码描述',
    field: 'channelErrorMsg',
  },
  {
    label: '支付通道异步回调内容',
    field: 'channelNotifyData',
  },
]
