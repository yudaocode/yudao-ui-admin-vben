import type { BasicColumn } from '@/components/Table'
import { DICT_TYPE } from '@/utils/dict'
import { useRender } from '@/components/Table'

export const columns: BasicColumn[] = [
  {
    title: '流程名称',
    dataIndex: 'name',
    width: 120,
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
    title: '流程版本',
    dataIndex: 'name',
    width: 120,
    customRender: ({ text }) => {
      return useRender.renderTag(text)
    },
  },
  {
    title: '流程描述',
    dataIndex: 'description',
    width: 200,
  },
]
