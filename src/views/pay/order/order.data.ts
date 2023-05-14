import { getMerchantListByName } from '@/api/pay/merchant'
import { DescItem } from '@/components/Description'
import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '订单编号',
    dataIndex: 'id',
    width: 100
  },
  {
    title: '支付渠道',
    children: [
      {
        title: '商户名称',
        dataIndex: 'merchantName',
        width: 120
      },
      {
        title: '应用名称',
        dataIndex: 'appName',
        width: 120
      },
      {
        title: '渠道名称',
        dataIndex: 'channelCodeName',
        width: 160
      }
    ]
  },
  {
    title: '支付订单',
    children: [
      {
        title: '商户',
        dataIndex: 'merchantOrderId',
        width: 100
      },
      {
        title: '支付',
        dataIndex: 'channelOrderNo',
        width: 200
      }
    ]
  },
  {
    title: '商品标题',
    dataIndex: 'subject',
    width: 200
  },
  {
    title: '支付金额(元)',
    dataIndex: 'amount',
    width: 120,
    customRender: ({ text }) => {
      return '￥' + parseFloat(text || 0 / 100).toFixed(2)
    }
  },
  {
    title: '手续金额(元)',
    dataIndex: 'channelFeeAmount',
    width: 120,
    customRender: ({ text }) => {
      return '￥' + parseFloat(text || 0 / 100).toFixed(2)
    }
  },
  {
    title: '退款金额(元)',
    dataIndex: 'refundAmount',
    width: 120,
    customRender: ({ text }) => {
      return '￥' + parseFloat(text || 0 / 100).toFixed(2)
    }
  },
  {
    title: '支付状态',
    dataIndex: 'status',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.PAY_ORDER_STATUS)
    }
  },
  {
    title: '回调状态',
    dataIndex: 'notifyStatus',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.PAY_ORDER_NOTIFY_STATUS)
    }
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    }
  },
  {
    title: '支付时间',
    dataIndex: 'successTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    }
  }
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '所属商户',
    field: 'merchantId',
    component: 'ApiSelect',
    componentProps: {
      api: () => getMerchantListByName('')
    },
    colProps: { span: 8 }
  },
  {
    label: '应用编号',
    field: 'appId',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '渠道编码',
    field: 'channelCode',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.PAY_CHANNEL_CODE_TYPE)
    },
    colProps: { span: 8 }
  },
  {
    label: '商户订单编号',
    field: 'merchantOrderId',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '渠道订单号',
    field: 'channelOrderNo',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '支付状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.PAY_ORDER_STATUS)
    },
    colProps: { span: 8 }
  },
  {
    label: '退款状态',
    field: 'refundStatus',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.PAY_ORDER_REFUND_STATUS)
    },
    colProps: { span: 8 }
  },
  {
    label: '回调商户状态',
    field: 'notifyStatus',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.PAY_ORDER_NOTIFY_STATUS)
    },
    colProps: { span: 8 }
  },
  {
    label: '创建时间',
    field: 'createTime',
    component: 'RangePicker',
    colProps: { span: 8 }
  }
]

export const descSchema: DescItem[] = [
  {
    label: '商户名称',
    field: 'merchantName'
  },
  {
    label: '应用名称',
    field: 'appName'
  },
  {
    label: '商品名称',
    field: 'subject'
  },
  {
    label: '商户订单号',
    field: 'merchantOrderId',
    render: (curVal) => {
      return useRender.renderTag(curVal)
    }
  },
  {
    label: '渠道订单号',
    field: 'channelOrderNo',
    render: (curVal) => {
      return useRender.renderTag(curVal)
    }
  },
  {
    label: '支付订单号',
    field: 'payOrderExtension.no',
    render: (curVal) => {
      return useRender.renderTag(curVal)
    }
  },
  {
    label: '支付金额',
    field: 'amount',
    render: (curVal) => {
      return '￥' + parseFloat(curVal || 0 / 100).toFixed(2)
    }
  },
  {
    label: '手续费',
    field: 'channelFeeAmount',
    render: (curVal) => {
      return '￥' + parseFloat(curVal || 0 / 100).toFixed(2)
    }
  },
  {
    label: '手续费比例',
    field: 'channelFeeRate',
    render: (curVal) => {
      return parseFloat(curVal || 0 / 100).toFixed(2) + '%'
    }
  },
  {
    label: '支付状态',
    field: 'status',
    render: (curVal) => {
      return useRender.renderDict(curVal, DICT_TYPE.PAY_ORDER_STATUS)
    }
  },
  {
    label: '回调状态',
    field: 'notifyStatus',
    render: (curVal) => {
      return useRender.renderDict(curVal, DICT_TYPE.PAY_ORDER_NOTIFY_STATUS)
    }
  },
  {
    label: '回调地址',
    field: 'notifyUrl'
  },
  {
    label: '创建时间',
    field: 'createTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    }
  },
  {
    label: '支付时间',
    field: 'successTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    }
  },
  {
    label: '失效时间',
    field: 'expireTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    }
  },
  {
    label: '通知时间',
    field: 'notifyTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    }
  },
  {
    label: '支付渠道',
    field: 'channelCodeName'
  },
  {
    label: '支付IP',
    field: 'userIp'
  },
  {
    label: '退款状态',
    field: 'notifyStatus',
    render: (curVal) => {
      return useRender.renderDict(curVal, DICT_TYPE.PAY_ORDER_REFUND_STATUS)
    }
  },
  {
    label: '退款次数',
    field: 'refundTimes'
  },
  {
    label: '退款金额',
    field: 'refundAmount',
    render: (curVal) => {
      return '￥' + parseFloat(curVal / 100).toFixed(2)
    }
  },
  {
    label: '商品描述',
    field: 'body'
  },
  {
    label: '支付通道异步回调内容',
    field: 'payOrderExtension.channelNotifyData'
  }
]
