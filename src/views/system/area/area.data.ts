import type { BasicColumn, FormSchema } from '@/components/Table'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    width: 100,
    align: 'left',
  },
  {
    title: '名字',
    dataIndex: 'name',
    width: 180,
  },
]

export const formSchema: FormSchema[] = [
  {
    label: 'IP',
    field: 'ip',
    required: true,
    component: 'Input',
  },
  {
    label: '地址',
    field: 'result',
    component: 'Input',
  },
]
