import { h } from 'vue'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { getListSimpleUsers } from '@/api/system/user/index'
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
    title: '类型',
    dataIndex: 'type',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE)
    },
  },
  {
    title: '发送人名称',
    dataIndex: 'nickname',
    width: 100,
  },
  {
    title: '模板内容',
    dataIndex: 'content',
    width: 300,
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
    title: '备注',
    dataIndex: 'remark',
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
    label: '模板名称',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '模版编码',
    field: 'code',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '状态',
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
    label: '模版编码',
    field: 'code',
    required: true,
    component: 'Input',
  },
  {
    label: '模板名称',
    field: 'name',
    required: true,
    component: 'Input',
  },
  {
    label: '发件人名称',
    field: 'nickname',
    required: true,
    component: 'Input',
  },
  {
    label: '模板内容',
    field: 'content',
    required: true,
    component: 'InputTextArea',
  },
  {
    label: '类型',
    field: 'type',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE),
    },
  },
  {
    label: '开启状态',
    field: 'status',
    required: true,
    component: 'RadioGroup',
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

// 发送站内信
// 这里加上前缀 防止和表单其他字段重名
export const keyPrefix = 'key$-'
export const baseSendSchemas: FormSchema[] = [
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
    field: 'userId',
    component: 'ApiSelect',
    label: '接收人 ',
    required: true,
    componentProps: {
      api: getListSimpleUsers,
      labelField: 'nickname',
      valueField: 'id',
    },
  },
]
