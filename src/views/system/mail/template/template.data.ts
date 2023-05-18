import { getSimpleMailAccountList } from '@/api/system/mail/account'
import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '模板编码',
    dataIndex: 'code',
    width: 100
  },
  {
    title: '模板名称',
    dataIndex: 'name',
    width: 180
  },
  {
    title: '模板标题',
    dataIndex: 'title',
    width: 100
  },
  {
    title: '模板内容',
    dataIndex: 'content',
    width: 300
  },
  {
    title: '邮箱账号',
    dataIndex: 'accountId',
    width: 120
  },
  {
    title: '发送人名称',
    dataIndex: 'nickname',
    width: 100
  },
  {
    title: '开启状态',
    dataIndex: 'status',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.COMMON_STATUS)
    }
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    }
  }
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '模板名称',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '模板编码',
    field: 'code',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '邮箱账号',
    field: 'accountId',
    component: 'ApiSelect',
    componentProps: {
      api: () => getSimpleMailAccountList(),
      fieldNames: {
        label: 'mail',
        key: 'id',
        value: 'id'
      }
    },
    colProps: { span: 8 }
  },
  {
    label: '开启状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS)
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

export const formSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input'
  },
  {
    label: '模板名称',
    field: 'name',
    required: true,
    component: 'Input'
  },
  {
    label: '模板编码',
    field: 'code',
    required: true,
    component: 'Input'
  },
  {
    label: '邮箱账号',
    field: 'accountId',
    required: true,
    component: 'ApiSelect',
    componentProps: {
      api: () => getSimpleMailAccountList(),
      fieldNames: {
        label: 'mail',
        key: 'id',
        value: 'id'
      }
    }
  },
  {
    label: '发送人名称',
    field: 'nickname',
    required: true,
    component: 'Input'
  },
  {
    label: '模板标题',
    field: 'title',
    required: true,
    component: 'Input'
  },
  {
    label: '模板内容',
    field: 'content',
    component: 'Editor',
    required: true
  },
  {
    label: '开启状态',
    field: 'status',
    component: 'Select',
    defaultValue: 0,
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS)
    }
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea'
  }
]

// 发送邮件
export const baseSendSchemas: FormSchema[] = [
  {
    field: 'content',
    component: 'Editor',
    label: '模板内容 ',
    required: false,
    defaultValue: ''
  },
  {
    field: 'mail',
    label: '收件邮箱 ',
    component: 'Input',
    componentProps: {
      placeholder: '输入收件邮箱'
    },
    required: true,
    rules: [
      {
        required: true,
        pattern: /^\w{3,}(\.\w+)*@[A-z0-9]+(\.[A-z]{2,5}){1,2}$/,
        trigger: 'blur',
        message: '邮箱格式不正确'
      }
    ]
  }
]
