import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '流程编号',
    dataIndex: 'id',
    width: 260,
  },
  {
    title: '流程名称',
    dataIndex: 'name',
    width: 100,
  },
  {
    title: '流程分类',
    dataIndex: 'category',
    width: 120,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.BPM_MODEL_CATEGORY)
    },
  },
  {
    title: '当前审批任务',
    dataIndex: 'tasks',
    width: 120,
    customRender: ({ record }) => {
      if (record.tasks && record.tasks.length > 0) {
        const texts: any[] = []
        record.tasks.forEach((val) => {
          texts.push(val.name)
        })
        return useRender.renderTags(texts)
      }
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS)
    },
  },
  {
    title: '提交时间',
    dataIndex: 'createTime',
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
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '流程名称',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '所属流程',
    field: 'processDefinitionId',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '流程分类',
    field: 'category',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.BPM_MODEL_CATEGORY),
    },
    colProps: { span: 8 },
  },
  {
    label: '状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS),
    },
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
    label: '提交时间',
    field: 'createTime',
    component: 'RangePicker',
    colProps: { span: 8 },
  },
]
