import type { DescItem } from '@/components/Description'
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
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '请假类型',
    field: 'type',
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
    field: 'result',
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

export const formSchema: FormSchema[] = [
  {
    label: '请假类型',
    field: 'type',
    required: true,
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.BPM_OA_LEAVE_TYPE),
    },
  },
  {
    label: '开始时间',
    field: 'startTime',
    required: true,
    component: 'DatePicker',
    componentProps: {
      showTime: true,
      format: 'YYYY-MM-DD HH:mm:ss',
      valueFormat: 'x',
    },
  },
  {
    label: '结束时间',
    field: 'endTime',
    required: true,
    component: 'DatePicker',
    componentProps: {
      showTime: true,
      format: 'YYYY-MM-DD HH:mm:ss',
      valueFormat: 'x',
    },
  },
  {
    label: '原因',
    field: 'reason',
    required: true,
    component: 'Input',
  },
]

export const descSchema: DescItem[] = [
  {
    label: '请假类型',
    field: 'merchantOrderId',
    render: (curVal) => {
      return useRender.renderTag(curVal)
    },
  },
  {
    label: '开始时间',
    field: 'startTime',
    render: (curVal) => {
      return useRender.renderDate(curVal, 'YYYY-MM-DD')
    },
  },
  {
    label: '结束时间',
    field: 'endTime',
    render: (curVal) => {
      return useRender.renderDate(curVal, 'YYYY-MM-DD')
    },
  },
  {
    label: '原因',
    field: 'reason',
  },
]
