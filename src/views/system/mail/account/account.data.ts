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
    title: '邮箱',
    dataIndex: 'mail',
    width: 180,
  },
  {
    title: '用户名',
    dataIndex: 'username',
    width: 100,
  },
  {
    title: 'SMTP 服务器域名',
    dataIndex: 'host',
    width: 120,
  },
  {
    title: 'SMTP 服务器端口',
    dataIndex: 'port',
    width: 120,
  },
  {
    title: '是否开启 SSL',
    dataIndex: 'sslEnable',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.INFRA_BOOLEAN_STRING)
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
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '邮箱',
    field: 'mail',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '用户名',
    field: 'username',
    component: 'Input',
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
    label: '邮箱',
    field: 'mail',
    required: true,
    component: 'Input',
    helpMessage: '填写发件邮箱地址',
    rules: [
      {
        required: true,
        message: '请输入正确的邮箱地址',
        pattern: /^\w{3,}(\.\w+)*@[A-z0-9]+(\.[A-z]{2,5}){1,2}$/,
        trigger: 'blur',
      },
    ],
  },
  {
    label: '用户名',
    field: 'username',
    required: true,
    component: 'Input',
  },
  {
    label: '密码/授权码',
    field: 'password',
    required: true,
    component: 'InputPassword',
    helpMessage: '填写邮件密码, 部分邮件商需要填写授权码',
  },
  {
    label: 'SMTP 服务器域名',
    field: 'host',
    required: true,
    component: 'Input',
  },
  {
    label: 'SMTP 服务器端口',
    field: 'port',
    required: true,
    component: 'InputNumber',
  },
  {
    label: '是否开启 SSL',
    field: 'sslEnable',
    required: true,
    defaultValue: false,
    component: 'RadioButtonGroup',
    componentProps: {
      options: getDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING, 'boolean'),
    },
  },
]
