import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { getDate } from '@/utils/dateUtil'
import { DICT_TYPE } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '任务编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '任务名称',
    dataIndex: 'name',
    width: 180,
  },
  {
    title: '所属流程',
    dataIndex: 'processInstance.name',
    width: 180,
  },
  {
    title: '流程发起人',
    dataIndex: 'processInstance.startUserNickname',
    width: 180,
  },
  {
    title: '结果',
    dataIndex: 'result',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.BPM_PROCESS_INSTANCE_RESULT)
    },
  },
  {
    title: '审批意见',
    dataIndex: 'reason',
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
  {
    title: '审批时间',
    dataIndex: 'endTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '耗时',
    dataIndex: 'durationInMillis',
    width: 180,
    customRender: ({ text }) => {
      return getDate(text)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '流程名',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '创建时间',
    field: 'createTime',
    component: 'RangePicker',
    colProps: { span: 8 },
  },
]
