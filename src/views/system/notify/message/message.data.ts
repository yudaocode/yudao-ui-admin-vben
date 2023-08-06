import { h } from 'vue'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { JsonPreview } from '@/components/CodeEditor'
import type { DescItem } from '@/components/Description/index'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '用户编号',
    dataIndex: 'userId',
    width: 100,
  },
  {
    title: '用户类型',
    dataIndex: 'userType',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.USER_TYPE)
    },
  },
  {
    title: '模板编码',
    dataIndex: 'templateCode',
    width: 100,
  },
  {
    title: '发送人名称',
    dataIndex: 'templateNickname',
    width: 120,
  },
  {
    title: '模版内容',
    dataIndex: 'templateContent',
    width: 240,
  },
  {
    title: '模版类型',
    dataIndex: 'templateType',
    width: 140,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE)
    },
  },
  {
    title: '是否已读',
    dataIndex: 'readStatus',
    width: 140,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.INFRA_BOOLEAN_STRING)
    },
  },
  {
    title: '阅读时间',
    dataIndex: 'readTime',
    width: 180,
    customRender: ({ text }) => {
      if (!text)
        return useRender.renderTag('未阅读')

      return useRender.renderDate(text)
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
    label: '用户编号',
    field: 'userId',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '用户类型',
    field: 'userType',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '模板编码',
    field: 'templateCode',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '模版类型',
    field: 'templateType',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE),
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

// 站内信详情modal
export const infoSchema: DescItem[] = [
  {
    field: 'id',
    label: '编号',
    labelMinWidth: 50,
  },
  {
    field: 'readStatus',
    label: '是否已读',
    render: (value) => {
      return useRender.renderDict(value, DICT_TYPE.INFRA_BOOLEAN_STRING)
    },
  },
  {
    field: 'userType',
    label: '用户类型',
    render: (value) => {
      return useRender.renderDict(value, DICT_TYPE.USER_TYPE)
    },
  },
  {
    field: 'userType',
    label: '用户编号',
  },
  {
    field: 'templateId',
    label: '模板编号',
  },
  {
    field: 'templateCode',
    label: '模板编码',
  },
  {
    field: 'templateNickname',
    label: '发送人名称',
  },
  {
    field: 'templateContent',
    label: '模板内容',
  },
  {
    field: 'templateParams',
    label: '模板参数',
    render: (value) => {
      return h(JsonPreview, { data: value })
    },
  },
  {
    field: 'templateType',
    label: '模板类型',
    render: (value) => {
      return useRender.renderDict(value, DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE)
    },
  },
  {
    field: 'readTime',
    label: '阅读时间',
    render: (value) => {
      if (!value)
        return useRender.renderTag('未阅读')

      return useRender.renderDate(value)
    },
  },
  {
    field: 'createTime',
    label: '创建时间',
    render: (value) => {
      return useRender.renderDate(value)
    },
  },
]

// 站内信详情
export interface MessageInfo {
  userId: number
  userType: number
  templateId: number
  templateCode: string
  templateNickname: string
  templateContent: string
  templateType: number
  templateParams: { [key: string]: string }
  readStatus: boolean
  readTime?: any
  id: number
  createTime: number
  key: string
}
