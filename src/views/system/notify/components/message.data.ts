import { h } from 'vue'
import { useRender } from '@/components/Table'
import { DICT_TYPE } from '@/utils/dict'
import { JsonPreview } from '@/components/CodeEditor'
import type { DescItem } from '@/components/Description/index'

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
