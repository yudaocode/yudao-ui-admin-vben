import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    width: 100
  },
  {
    title: '用户编号',
    dataIndex: 'userId',
    width: 100
  },
  {
    title: '用户类型',
    dataIndex: 'userType',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.USER_TYPE)
    }
  },
  {
    title: '模板编码',
    dataIndex: 'templateCode',
    width: 100
  },
  {
    title: '发送人名称',
    dataIndex: 'templateNickname',
    width: 120
  },
  {
    title: '模版内容',
    dataIndex: 'templateContent',
    width: 240
  },
  {
    title: '模版类型',
    dataIndex: 'templateType',
    width: 140,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE)
    }
  },
  {
    title: '是否已读',
    dataIndex: 'readStatus',
    width: 140,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.INFRA_BOOLEAN_STRING)
    }
  },
  {
    title: '阅读时间',
    dataIndex: 'readTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
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
    label: '用户编号',
    field: 'userId',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '用户类型',
    field: 'userType',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '模板编码',
    field: 'templateCode',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '模版类型',
    field: 'templateType',
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE)
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
