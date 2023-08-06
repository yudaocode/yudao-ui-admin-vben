import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'

export const columns: BasicColumn[] = [
  {
    title: '主键编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '数据源名称',
    dataIndex: 'name',
    width: 180,
  },
  {
    title: '数据源连接',
    dataIndex: 'url',
    width: 100,
  },
  {
    title: '用户名',
    dataIndex: 'username',
    width: 120,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
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
    label: '数据源名称',
    field: 'name',
    required: true,
    component: 'Input',
  },
  {
    label: '数据源连接',
    field: 'url',
    required: true,
    component: 'Input',
  },
  {
    label: '用户名',
    field: 'username',
    required: true,
    component: 'Input',
  },
  {
    label: '密码',
    field: 'password',
    required: true,
    component: 'Input',
  },
]
