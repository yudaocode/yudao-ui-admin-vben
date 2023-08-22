import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '公告编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '签到天数',
    dataIndex: 'day',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderTag(`第 ${text} 天`)
    },
  },
  {
    title: '获得积分',
    dataIndex: 'point',
    width: 180,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.COMMON_STATUS)
    },
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
    label: '签到天数',
    field: 'day',
    required: true,
    helpMessage: '只允许设置 1-7，默认签到 7 天为一个周期',
    component: 'InputNumber',
    componentProps: {
      max: 7,
      min: 1,
      precision: 0,
    },
  },
  {
    label: '签到分数',
    field: 'point',
    required: true,
    component: 'InputNumber',
    componentProps: {
      precision: 0,
    },
  },
  {
    label: '状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS),
    },
  },
]
