import { getIntDictOptions } from '@/utils/dict'
import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE } from '@/utils/dict'
import { getSimpleMailAccountList } from '@/api/system/mail/account'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    width: 100
  },
  {
    title: '发送时间',
    dataIndex: 'sendTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    }
  },
  {
    title: '接收邮箱',
    dataIndex: 'toMail',
    width: 200
  },
  {
    title: '邮件标题',
    dataIndex: 'templateTitle',
    width: 180
  },
  {
    title: '发送状态',
    dataIndex: 'sendStatus',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_MAIL_SEND_STATUS)
    }
  },
  {
    title: '邮箱账号',
    dataIndex: 'fromMail',
    width: 180
  },
  {
    title: '模板编号',
    dataIndex: 'templateId',
    width: 180
  }
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '接收邮箱',
    field: 'toMail',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '邮箱账号',
    field: 'accountId',
    component: 'ApiSelect',
    componentProps: {
      api: () => getSimpleMailAccountList(),
      labelField: 'mail',
      valueField: 'id'
    },
    colProps: { span: 8 }
  },
  {
    label: '模板编号',
    field: 'templateId',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '发送状态',
    field: 'sendStatus',
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.SYSTEM_MAIL_SEND_STATUS)
    },
    colProps: { span: 8 }
  },
  {
    label: '用户编号',
    field: 'userId',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '用户类型',
    field: 'userType',
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.USER_TYPE)
    },
    colProps: { span: 8 }
  },
  {
    label: '发送时间',
    field: 'sendTime',
    component: 'RangePicker',
    colProps: { span: 8 }
  }
]
