import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'

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
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '状态',
    dataIndex: 'suspensionState',
    width: 180,
    customRender: ({ text }) => {
      if (text === 1)
        return useRender.renderTag('激活', 'success')
      else if (text === 2)
        return useRender.renderTag('挂起', 'warning')
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
