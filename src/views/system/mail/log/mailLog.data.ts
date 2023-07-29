import { h } from 'vue'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { getSimpleMailAccountList } from '@/api/system/mail/account'
import type { DescItem } from '@/components/Description/index'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '接收邮箱',
    dataIndex: 'toMail',
    width: 200,
  },
  {
    title: '邮件标题',
    dataIndex: 'templateTitle',
    width: 180,
  },
  {
    title: '发送状态',
    dataIndex: 'sendStatus',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_MAIL_SEND_STATUS)
    },
  },
  {
    title: '邮箱账号',
    dataIndex: 'fromMail',
    width: 180,
  },
  {
    title: '模板编号',
    dataIndex: 'templateId',
    width: 100,
  },
  {
    title: '发送时间',
    dataIndex: 'sendTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '接收邮箱',
    field: 'toMail',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '邮箱账号',
    field: 'accountId',
    component: 'ApiSelect',
    componentProps: {
      api: () => getSimpleMailAccountList(),
      labelField: 'mail',
      valueField: 'id',
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
      options: getDictOptions(DICT_TYPE.SYSTEM_MAIL_SEND_STATUS),
    },
    colProps: { span: 8 },
  },
  {
    label: '用户编号',
    field: 'userId',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '用户类型',
    field: 'userType',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.USER_TYPE),
    },
    colProps: { span: 8 },
  },
  {
    label: '发送时间',
    field: 'sendTime',
    component: 'RangePicker',
    colProps: { span: 8 },
  },
]

export const logSchema: DescItem[] = [
  {
    field: 'sendStatus',
    label: '发送状态',
    labelMinWidth: 80,
    render(value) {
      return useRender.renderDict(value, DICT_TYPE.SYSTEM_MAIL_SEND_STATUS)
    },
  },
  {
    field: 'sendException',
    label: '异常信息',
    labelMinWidth: 80,
    show: data => data && data.sendException && data.sendException.length > 0,
    render(value) {
      return h('span', { style: { fontWeight: 'bold' } }, value)
    },
  },
  {
    field: 'sendTime',
    label: '发送时间',
    render(value) {
      return useRender.renderDate(value)
    },
  },
  {
    field: 'userId',
    label: '用户类型',
    render(_, data) {
      const { userId, userType } = data
      const uidTag = useRender.renderTag(`uid: ${userId}`)
      const typeTag = useRender.renderDict(userType, DICT_TYPE.USER_TYPE)
      return h('span', {}, [typeTag, uidTag])
    },
  },
  {
    field: 'fromMail',
    label: '发件邮箱',
  },
  {
    field: 'toMail',
    label: '收件邮箱',
  },
  {
    field: 'templateNickname',
    label: '发件昵称',
  },
  {
    field: 'templateTitle',
    label: '邮件标题',
  },
  {
    field: 'templateContent',
    label: '邮件内容',
    render(value) {
      return h('div', { innerHTML: value })
    },
  },
  {
    field: 'templateParams',
    label: '邮件参数',
    render(value) {
      return useRender.renderJsonPreview(value)
    },
  },
  {
    field: 'sendMessageId',
    label: '返回ID',
  },
  {
    field: 'templateCode',
    label: '模板编码',
  },
  {
    field: 'templateId',
    label: '模板编号',
  },
  {
    field: 'createTime',
    label: '记录时间',
    render(value) {
      return useRender.renderDate(value)
    },
  },
]
