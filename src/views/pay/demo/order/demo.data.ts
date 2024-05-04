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
    title: '用户编号',
    dataIndex: 'userId',
    width: 100,
  },
  {
    title: '商品名字',
    dataIndex: 'spuName',
    width: 100,
  },
  {
    title: '支付价格',
    dataIndex: 'price',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderTag(`￥${(text / 100.0).toFixed(2)}`)
    },
  },
  {
    title: '退款金额',
    dataIndex: 'refundPrice',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderTag(`￥${(text / 100.0).toFixed(2)}`)
    },
  },
  {
    title: '支付单号',
    dataIndex: 'payOrderId',
    width: 100,
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
    title: '是否支付',
    dataIndex: 'payed',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.INFRA_BOOLEAN_STRING)
    },
  },
  {
    title: '支付时间',
    dataIndex: 'payTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '退款时间',
    dataIndex: 'refundTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '支付单号',
    field: 'payOrderId',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '是否支付',
    field: 'payed',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING),
    },
    colProps: { span: 8 },
  },
]

export const formSchema: FormSchema[] = [
  {
    label: '商品',
    field: 'spuId',
    component: 'Select',
    required: true,
    componentProps: {
      options: [
        { value: 1, label: '华为手机', price: 1 },
        { value: 2, label: '小米电视', price: 10 },
        { value: 3, label: '苹果手表', price: 100 },
        { value: 4, label: '华硕笔记本', price: 1000 },
        { value: 5, label: '蔚来汽车', price: 200000 },
      ],
    },
  },
]
