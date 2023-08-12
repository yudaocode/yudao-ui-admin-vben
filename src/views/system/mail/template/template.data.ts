import { h } from 'vue'
import { getSimpleMailAccountList } from '@/api/system/mail/account'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { ScrollContainer } from '@/components/Container'

export const columns: BasicColumn[] = [
  {
    title: '模板编码',
    dataIndex: 'code',
    width: 100,
  },
  {
    title: '模板名称',
    dataIndex: 'name',
    width: 180,
  },
  {
    title: '模板标题',
    dataIndex: 'title',
    width: 100,
  },
  {
    title: '模板内容',
    dataIndex: 'content',
    width: 300,
  },
  {
    title: '邮箱账号',
    dataIndex: 'accountId',
    width: 120,
  },
  {
    title: '发送人名称',
    dataIndex: 'nickname',
    width: 100,
  },
  {
    title: '开启状态',
    dataIndex: 'status',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.COMMON_STATUS)
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
    label: '模板名称',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '模板编码',
    field: 'code',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '发件邮箱',
    field: 'accountId',
    component: 'ApiSelect',
    componentProps: {
      api: () => getSimpleMailAccountList(),
      fieldNames: {
        label: 'mail',
        key: 'id',
        value: 'id',
      },
    },
    colProps: { span: 8 },
  },
  {
    label: '开启状态',
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
    label: '模板名称',
    field: 'name',
    required: true,
    component: 'Input',
  },
  {
    label: '模板编码',
    field: 'code',
    required: true,
    component: 'Input',
    helpMessage: '建议使用下划线/数字/字母命名',
  },
  {
    label: '发件邮箱',
    field: 'accountId',
    required: true,
    component: 'ApiSelect',
    componentProps: {
      api: () => getSimpleMailAccountList(),
      fieldNames: {
        label: 'mail',
        key: 'id',
        value: 'id',
      },
    },
  },
  {
    label: '发送人名称',
    field: 'nickname',
    required: true,
    component: 'Input',
    helpMessage: '发件人的名称, 如:系统发件人',
  },
  {
    label: '模板标题',
    field: 'title',
    required: true,
    component: 'Input',
    helpMessage: '邮件的标题',
  },
  {
    label: '模板内容',
    field: 'content',
    component: 'Editor',
    required: true,
    helpMessage: '{}括号中的内容作为模板参数',
  },
  {
    label: '开启状态',
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
]

// 发送邮件
// 这里加上前缀 防止和表单其他字段重名
export const keyPrefix = 'key$-'
export const baseSendSchemas: FormSchema[] = [
  {
    field: 'code',
    label: '编码',
    component: 'Input',
    show: () => false,
  },
  {
    field: 'content',
    component: 'Editor',
    label: '模板内容 ',
    required: false,
    defaultValue: '',
    render({ model }) {
      let content: string = model.content
      Object.keys(model).forEach((key) => {
        if (!key.startsWith(keyPrefix))
          return

        const realKey = key.split(keyPrefix)[1]
        content = content.replace(`{${realKey}}`, model[key])
      })
      return h(ScrollContainer, {
        innerHTML: content,
        style: { border: '1px solid #e8e8e8', borderRadius: '6px', padding: '10px' },
      })
    },
  },
  {
    field: 'mail',
    label: '收件邮箱 ',
    component: 'Input',
    componentProps: {
      placeholder: '输入收件邮箱',
    },
    required: true,
    rules: [
      {
        required: true,
        pattern: /^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/,
        trigger: 'blur',
        message: '邮箱格式不正确',
      },
    ],
  },
]
