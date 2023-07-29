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
    title: '短信签名',
    dataIndex: 'signature',
    width: 180,
  },
  {
    title: '渠道编码',
    dataIndex: 'code',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE)
    },
  },
  {
    title: '启用状态',
    dataIndex: 'status',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.COMMON_STATUS)
    },
  },
  {
    title: '备注',
    dataIndex: 'remark',
    width: 180,
  },
  {
    title: '短信 API 的账号',
    dataIndex: 'apiKey',
    width: 180,
  },
  {
    title: '短信 API 的密钥',
    dataIndex: 'apiSecret',
    width: 180,
  },
  {
    title: '短信发送回调 URL',
    dataIndex: 'callbackUrl',
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
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '短信签名',
    field: 'signature',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '启用状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS),
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

export const formSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input',
  },
  {
    label: '短信签名',
    field: 'signature',
    required: true,
    component: 'Input',
  },
  {
    label: '渠道编码',
    field: 'code',
    component: 'Select',
    required: true,
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE, 'string'),
    },
  },
  {
    label: '启用状态',
    field: 'status',
    component: 'Select',
    defaultValue: 0,
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS),
    },
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
  },
  {
    label: '短信 API 的账号',
    field: 'apiKey',
    required: true,
    component: 'Input',
  },
  {
    label: '短信 API 的密钥',
    field: 'apiSecret',
    component: 'Input',
  },
  {
    label: '短信发送回调 URL',
    field: 'callbackUrl',
    component: 'Input',
  },
]
