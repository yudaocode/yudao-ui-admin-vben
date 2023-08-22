import { getAppList } from '@/api/pay/app'
import type { DescItem } from '@/components/Description'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '订单编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '支付金额(元)',
    dataIndex: 'amount',
    width: 120,
    customRender: ({ text }) => {
      return `￥${Number.parseFloat(text || 0 / 100).toFixed(2)}`
    },
  },
  {
    title: '手续金额(元)',
    dataIndex: 'channelFeeAmount',
    width: 120,
    customRender: ({ text }) => {
      return `￥${Number.parseFloat(text || 0 / 100).toFixed(2)}`
    },
  },
  {
    title: '退款金额(元)',
    dataIndex: 'refundAmount',
    width: 120,
    customRender: ({ text }) => {
      return `￥${Number.parseFloat(text || 0 / 100).toFixed(2)}`
    },
  },
  {
    title: '订单号',
    children: [
      {
        title: '商户',
        dataIndex: 'merchantOrderId',
        width: 120,
      },
      {
        title: '支付',
        dataIndex: 'no',
        width: 120,
      },
      {
        title: '渠道',
        dataIndex: 'channelOrderNo',
        width: 160,
      },
    ],
  },
  {
    title: '支付状态',
    dataIndex: 'status',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.PAY_ORDER_STATUS)
    },
  },
  {
    title: '支付渠道',
    dataIndex: 'channelCode',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.PAY_CHANNEL_CODE)
    },
  },
  {
    title: '支付应用',
    dataIndex: 'appName',
    width: 100,
  },
  {
    title: '商品标题',
    dataIndex: 'subject',
    width: 180,
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
    title: '支付时间',
    dataIndex: 'successTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
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
    label: '支付渠道',
    field: 'channelCode',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.PAY_CHANNEL_CODE),
    },
    colProps: { span: 8 },
  },
  {
    label: '商户单号',
    field: 'merchantOrderId',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '支付单号',
    field: 'no',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '渠道单号',
    field: 'channelOrderNo',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '支付状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.PAY_ORDER_STATUS),
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
    label: '商户单号',
    field: 'merchantOrderId',
  },
  {
    label: '支付单号',
    field: 'no',
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
    label: '支付状态',
    field: 'status',
    render: (curVal) => {
      return useRender.renderDict(curVal, DICT_TYPE.PAY_ORDER_STATUS)
    },
  },
  {
    label: '支付金额',
    field: 'amount',
    render: (curVal) => {
      return `￥${Number.parseFloat(curVal || 0 / 100).toFixed(2)}`
    },
  },
  {
    label: '手续费',
    field: 'channelFeeAmount',
    render: (curVal) => {
      return `￥${Number.parseFloat(curVal || 0 / 100).toFixed(2)}`
    },
  },
  {
    label: '手续费比例',
    field: 'channelFeeRate',
    render: (curVal) => {
      return `${Number.parseFloat(curVal || 0 / 100).toFixed(2)}%`
    },
  },
  {
    label: '支付时间',
    field: 'successTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    },
  },
  {
    label: '失效时间',
    field: 'expireTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
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
    label: '更新时间',
    field: 'updateTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    },
  },
  {
    label: '商品标题',
    field: 'subject',
  },
  {
    label: '商品描述',
    field: 'body',
  },
  {
    label: '支付渠道',
    field: 'channelCode',
    render: (curVal) => {
      return useRender.renderDict(curVal, DICT_TYPE.PAY_CHANNEL_CODE)
    },
  },
  {
    label: '支付 IP',
    field: 'userIp',
  },
  {
    label: '渠道单号',
    field: 'channelOrderNo',
    render: (curVal) => {
      return useRender.renderTag(curVal)
    },
  },
  {
    label: '渠道用户',
    field: 'channelUserId',
  },
  {
    label: '退款金额',
    field: 'refundPrice',
    render: (curVal) => {
      return `￥${Number.parseFloat(`${curVal / 100}`).toFixed(2)}`
    },
  },
  {
    label: '通知 URL',
    field: 'notifyUrl',
  },
  {
    label: '支付通道异步回调内容',
    field: 'extension.channelNotifyData',
  },
]
