import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '签到用户',
    dataIndex: 'nickname',
    width: 200,
  },
  {
    title: '签到天数',
    dataIndex: 'day',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderTag(`第 ${text} 天`)
    },
  },
  {
    title: '获得积分',
    dataIndex: 'point',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderTag(text, text > 0 ? 'blue' : 'red')
    },
  },
  {
    title: '签到时间',
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '签到用户',
    field: 'nickname',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '签到天数',
    field: 'bizType',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '签到时间',
    field: 'createTime',
    component: 'RangePicker',
    colProps: { span: 8 },
  },
]
