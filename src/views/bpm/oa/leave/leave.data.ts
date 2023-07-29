import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '申请编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '状态',
    dataIndex: 'result',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.BPM_PROCESS_INSTANCE_RESULT)
    },
  },
  {
    title: '开始时间',
    dataIndex: 'startTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '结束时间',
    dataIndex: 'endTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '请假类型',
    dataIndex: 'type',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.BPM_OA_LEAVE_TYPE)
    },
  },
  {
    title: '原因',
    dataIndex: 'reason',
    width: 180,
  },
  {
    title: '申请时间',
    dataIndex: 'applyTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '请假类型',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.BPM_OA_LEAVE_TYPE),
    },
    colProps: { span: 8 },
  },
  {
    label: '申请时间',
    field: 'createTime',
    component: 'RangePicker',
    colProps: { span: 8 },
  },
  {
    label: '结果',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_RESULT),
    },
    colProps: { span: 8 },
  },
  {
    label: '原因',
    field: 'reason',
    component: 'Input',
    colProps: { span: 8 },
  },
]
