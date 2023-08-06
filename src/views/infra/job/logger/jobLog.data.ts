import { h } from 'vue'
import type { DescItem } from '@/components/Description'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { JsonPreview } from '@/components/CodeEditor'

export const columns: BasicColumn[] = [
  {
    title: '日志编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '任务编号',
    dataIndex: 'jobId',
    width: 100,
  },
  {
    title: '处理器的名字',
    dataIndex: 'handlerName',
    width: 180,
  },
  {
    title: '处理器的参数',
    dataIndex: 'handlerParam',
    width: 180,
  },
  {
    title: '第几次执行',
    dataIndex: 'executeIndex',
    width: 100,
  },
  {
    title: '执行时间',
    dataIndex: 'beginTime',
    width: 180,
    customRender: ({ record }) => {
      const startTime = useRender.renderDate(record.beginTime)
      const endTime = useRender.renderDate(record.endTime)
      return useRender.renderTags([startTime, endTime])
    },
  },
  {
    title: '执行时长',
    dataIndex: 'duration',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderText(text, ' 毫秒')
    },
  },
  {
    title: '任务状态',
    dataIndex: 'status',
    width: 180,
    customRender: ({ record }) => {
      return useRender.renderDict(record.status, DICT_TYPE.INFRA_JOB_LOG_STATUS)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '处理器的名字',
    field: 'handlerName',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '开始执行时间',
    field: 'beginTime',
    component: 'DatePicker',
    colProps: { span: 8 },
  },
  {
    label: '结束执行时间',
    field: 'endTime',
    component: 'DatePicker',
    colProps: { span: 8 },
  },
  {
    label: '任务状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.INFRA_JOB_STATUS),
    },
    colProps: { span: 8 },
  },
  {
    label: '处理器的名字',
    field: 'handlerName',
    component: 'Input',
    colProps: { span: 8 },
  },
]

export const descSchema: DescItem[] = [
  {
    label: '日志编号',
    field: 'id',
  },
  {
    label: '任务编号',
    field: 'jobId',
  },
  {
    label: '处理器的名字',
    field: 'handlerName',
  },
  {
    label: '处理器的参数',
    field: 'handlerParam',
  },
  {
    label: '第几次执行',
    field: 'executeIndex',
  },
  {
    label: '执行时间',
    field: 'beginTime',
    render: (_, data) => {
      const startTime = `开始: ${useRender.renderDate(data.beginTime)}`
      const endTime = `结束: ${useRender.renderDate(data.endTime)}`
      return h('span', {}, [startTime, h('br'), endTime])
    },
  },
  {
    label: '执行时长',
    field: 'duration',
    render: (curVal) => {
      return useRender.renderText(curVal, ' 毫秒')
    },
  },
  {
    label: '任务状态',
    field: 'status',
    render: (curVal) => {
      return useRender.renderDict(curVal, DICT_TYPE.INFRA_JOB_LOG_STATUS)
    },
  },
  {
    label: '执行结果',
    field: 'result',
    render: (curVal) => {
      const data = JSON.parse(curVal)
      return h(JsonPreview, { data })
    },
  },
]
