import { getSimpleSmsChannels } from '@/api/system/sms/smsChannel'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '日志编号',
    dataIndex: 'id',
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
    title: '手机号',
    dataIndex: 'mobile',
    width: 180,
    customRender: ({ text, record }) => {
      if (record.userType && record.userId)
        return `${useRender.renderDict(record.userType, DICT_TYPE.USER_TYPE)}record.userId`
      else
        return text
    },
  },
  {
    title: '短信内容',
    dataIndex: 'templateContent',
    width: 300,
  },
  {
    title: '发送状态',
    dataIndex: 'sendStatus',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_SMS_SEND_STATUS)
    },
  },
  {
    title: '接收状态',
    dataIndex: 'receiveStatus',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS)
    },
  },
  {
    title: '短信渠道',
    dataIndex: 'channelCode',
    width: 180,
    customRender: ({ text, record }) => {
      return useRender.renderText(record.channelId, '') || `${useRender.renderDict(text, DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE)}` || ''
    },
  },
  {
    title: '模板编号',
    dataIndex: 'templateId',
    width: 120,
  },
  {
    title: '短信类型',
    dataIndex: 'templateType',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '手机号',
    field: 'mobile',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '短信渠道',
    field: 'channelId',
    component: 'ApiSelect',
    componentProps: {
      api: getSimpleSmsChannels,
      fieldNames: {
        label: 'signature',
        key: 'id',
        value: 'id',
      },
    },
    colProps: { span: 8 },
  },
  {
    label: '模板编号',
    field: 'templateId',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '发送状态',
    field: 'sendStatus',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_SMS_SEND_STATUS),
    },
    colProps: { span: 8 },
  },
  {
    label: '发送时间',
    field: 'sendTime',
    component: 'RangePicker',
    colProps: { span: 8 },
  },
  {
    label: '接收状态',
    field: 'receiveStatus',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS),
    },
    colProps: { span: 8 },
  },
  {
    label: '接收时间',
    field: 'receiveTime',
    component: 'RangePicker',
    colProps: { span: 8 },
  },
]
