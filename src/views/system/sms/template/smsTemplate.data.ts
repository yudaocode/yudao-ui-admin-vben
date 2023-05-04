import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '模板编码',
    dataIndex: 'code',
    width: 180
  },
  {
    title: '模板名称',
    dataIndex: 'name',
    width: 100
  },
  {
    title: '模板内容',
    dataIndex: 'content',
    width: 300
  },
  {
    title: '短信类型',
    dataIndex: 'type',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE)
    }
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
    title: '短信 API 的模板编号',
    dataIndex: 'apiTemplateId',
    width: 180
  },
  {
    title: '短信渠道',
    dataIndex: 'channelCode',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE)
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
    label: '短信类型',
    field: 'type',
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE)
    },
    colProps: { span: 8 }
  },
  {
    label: '开启状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS)
    },
    colProps: { span: 8 }
  },
  {
    label: '模板编码',
    field: 'code',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '短信 API 的模板编号',
    field: 'apiTemplateId',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '短信渠道',
    field: 'channelId',
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE)
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
    label: '短信渠道编号',
    field: 'channelId',
    required: true,
    component: 'Input'
  },
  {
    label: '短信类型',
    field: 'type',
    component: 'Select',
    defaultValue: 0,
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE)
    }
  },
  {
    label: '模板编号',
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
    label: '模板内容',
    field: 'content',
    required: true,
    component: 'Input'
  },
  {
    label: '开启状态',
    field: 'status',
    component: 'Select',
    defaultValue: 0,
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS)
    }
  },
  {
    label: '短信 API 模板编号',
    field: 'apiTemplateId',
    required: true,
    component: 'Input'
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea'
  }
]
