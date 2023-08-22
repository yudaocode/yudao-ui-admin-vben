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
    title: '公告标题',
    dataIndex: 'title',
    width: 180,
  },
  {
    title: '公告类型',
    dataIndex: 'type',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_NOTICE_TYPE)
    },
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.COMMON_STATUS)
    },
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '公告标题',
    field: 'title',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '公告状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS),
    },
    colProps: { span: 8 },
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
    label: '公告标题',
    field: 'title',
    required: true,
    component: 'Input',
  },
  {
    label: '公告类型',
    field: 'type',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_NOTICE_TYPE),
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
  {
    label: '内容',
    field: 'content',
    component: 'Editor',
  },
]
