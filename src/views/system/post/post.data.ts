import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '岗位编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '岗位名称',
    dataIndex: 'name',
    width: 180,
  },
  {
    title: '岗位编码',
    dataIndex: 'code',
    width: 100,
  },
  {
    title: '岗位顺序',
    dataIndex: 'sort',
    width: 120,
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
    title: '备注',
    dataIndex: 'remark',
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
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '岗位名称',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '岗位编码',
    field: 'code',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '状态',
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
    label: '岗位名称',
    field: 'name',
    required: true,
    component: 'Input',
  },
  {
    label: '岗位编码',
    field: 'code',
    required: true,
    component: 'Input',
  },
  {
    label: '岗位顺序',
    field: 'sort',
    required: true,
    defaultValue: 0,
    component: 'InputNumber',
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
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
  },
]
