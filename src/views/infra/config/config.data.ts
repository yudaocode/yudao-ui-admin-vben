import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '参数主键',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '参数分类',
    dataIndex: 'category',
    width: 180,
  },
  {
    title: '参数名称',
    dataIndex: 'name',
    width: 100,
  },
  {
    title: '参数键名',
    dataIndex: 'key',
    width: 120,
  },
  {
    title: '参数键值',
    dataIndex: 'value',
    width: 120,
  },
  {
    title: '系统内置',
    dataIndex: 'type',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.INFRA_CONFIG_TYPE)
    },
  },
  {
    title: '是否可见',
    dataIndex: 'visible',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderTag(text ? '是' : '否')
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
    label: '参数名称',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '参数键名',
    field: 'key',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '系统内置',
    field: 'type',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.INFRA_CONFIG_TYPE),
    },
    colProps: { span: 8 },
  },
  {
    label: '创建时间',
    field: 'createTime',
    component: 'RangePicker',
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
    label: '参数分类',
    field: 'category',
    required: true,
    component: 'Input',
  },
  {
    label: '参数名称',
    field: 'name',
    required: true,
    component: 'Input',
  },
  {
    label: '参数键名',
    field: 'key',
    required: true,
    component: 'Input',
  },
  {
    label: '参数键值',
    field: 'value',
    required: true,
    component: 'Input',
  },
  {
    label: '是否可见',
    field: 'visible',
    component: 'RadioGroup',
    componentProps: {
      options: [
        { key: true, label: '是', value: true },
        { key: false, label: '否', value: false },
      ],
    },
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
  },
]
