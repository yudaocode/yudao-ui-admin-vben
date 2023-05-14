import { getMerchantListByName } from '@/api/pay/merchant'
import { DescItem } from '@/components/Description'
import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '编号',
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
    title: '商户订单号',
    children: [
      {
        title: '退款',
        dataIndex: 'merchantRefundNo',
        width: 200
      },
      {
        title: '交易',
        dataIndex: 'merchantOrderId',
        width: 100
      }
    ]
  },
  {
    title: '支付订单号',
    children: [
      {
        title: '交易',
        dataIndex: 'tradeNo',
        width: 100
      },
      {
        title: '渠道',
        dataIndex: 'channelOrderNo',
        width: 200
      }
    ]
  },
  {
    title: '支付金额(元)',
    dataIndex: 'payAmount',
    width: 120,
    customRender: ({ text }) => {
      return '￥' + parseFloat(text / 100).toFixed(2)
    }
  },
  {
    title: '退款金额(元)',
    dataIndex: 'refundAmount',
    width: 120,
    customRender: ({ text }) => {
      return '￥' + parseFloat(text / 100).toFixed(2)
    }
  },
  {
    title: '退款类型',
    dataIndex: 'type',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.PAY_REFUND_ORDER_TYPE)
    }
  },
  {
    title: '退款状态',
    dataIndex: 'status',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.PAY_REFUND_ORDER_STATUS)
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
    title: '退款原因',
    dataIndex: 'reason',
    width: 100
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
    title: '退款成功时间',
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
    label: '退款类型',
    field: 'type',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.PAY_REFUND_ORDER_TYPE)
    },
    colProps: { span: 8 }
  },
  {
    label: '商户退款订单号',
    field: 'merchantRefundNo',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '应用编号',
    field: 'appId',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '退款状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.PAY_REFUND_ORDER_STATUS)
    },
    colProps: { span: 8 }
  },
  {
    label: '退款回调状态',
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
    label: '商户退款单号',
    field: 'merchantRefundNo',
    render: (curVal) => {
      return useRender.renderTag(curVal)
    }
  },
  {
    label: '商户订单号',
    field: 'merchantOrderId'
  },
  {
    label: '支付金额',
    field: 'payAmount',
    render: (curVal) => {
      return '￥' + parseFloat(curVal / 100).toFixed(2)
    }
  },
  {
    label: '退款金额',
    field: 'refundAmount',
    render: (curVal) => {
      return '￥' + parseFloat(curVal / 100).toFixed(2)
    }
  },
  {
    label: '退款类型',
    field: 'type',
    render: (curVal) => {
      return useRender.renderDict(curVal, DICT_TYPE.PAY_REFUND_ORDER_TYPE)
    }
  },
  {
    label: '退款状态',
    field: 'status',
    render: (curVal) => {
      return useRender.renderDict(curVal, DICT_TYPE.PAY_REFUND_ORDER_STATUS)
    }
  },
  {
    label: '创建时间',
    field: 'createTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    }
  },
  {
    label: '退款成功时间',
    field: 'successTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    }
  },
  {
    label: '退款失效时间',
    field: 'expireTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    }
  },
  {
    label: '更新时间',
    field: 'updateTime',
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
    label: '回调地址',
    field: 'notifyUrl'
  },
  {
    label: '回调状态',
    field: 'notifyStatus',
    render: (curVal) => {
      return useRender.renderDict(curVal, DICT_TYPE.PAY_ORDER_NOTIFY_STATUS)
    }
  },
  {
    label: '回调时间',
    field: 'notifyTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    }
  },
  {
    label: '渠道订单号',
    field: 'channelOrderNo'
  },
  {
    label: '渠道退款单号',
    field: 'channelRefundNo'
  },
  {
    label: '渠道错误码',
    field: 'channelErrorCode'
  },
  {
    label: '渠道错误码描述',
    field: 'notifchannelErrorMsgyUrl'
  },
  {
    label: '渠道额外参数',
    field: 'channelExtras'
  },
  {
    label: '退款原因',
    field: 'reason'
  }
]
