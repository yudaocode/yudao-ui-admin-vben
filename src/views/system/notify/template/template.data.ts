import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

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
    title: '类型',
    dataIndex: 'type',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE)
    }
  },
  {
    title: '发送人名称',
    dataIndex: 'nickname',
    width: 100
  },
  {
    title: '模板内容',
    dataIndex: 'content',
    width: 300
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
    title: '备注',
    dataIndex: 'remark',
    width: 180
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
    label: '模版编码',
    field: 'code',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS)
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
    label: '模版编码',
    field: 'code',
    required: true,
    component: 'Input'
  },
  {
    label: '模板名称',
    field: 'name',
    required: true,
    component: 'Input'
  },
  {
    label: '发件人名称',
    field: 'nickname',
    required: true,
    component: 'Input'
  },
  {
    label: '模板内容',
    field: 'content',
    required: true,
    component: 'InputTextArea'
  },
  {
    label: '类型',
    field: 'type',
    component: 'Select',
    defaultValue: 0,
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE)
    }
  },
  {
    label: '开启状态',
    field: 'status',
    component: 'RadioGroup',
    defaultValue: 0,
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS)
    }
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea'
  }
]
