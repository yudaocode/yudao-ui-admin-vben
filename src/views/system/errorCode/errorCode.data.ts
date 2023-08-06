import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '类型',
    dataIndex: 'type',
    width: 80,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_ERROR_CODE_TYPE)
    },
  },
  {
    title: '应用名',
    dataIndex: 'applicationName',
    width: 200,
  },
  {
    title: '错误码编码',
    dataIndex: 'code',
    width: 120,
  },
  {
    title: '错误码提示',
    dataIndex: 'message',
    width: 300,
  },
  {
    title: '备注',
    dataIndex: 'memo',
    width: 200,
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
    label: '错误码类型',
    field: 'type',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_ERROR_CODE_TYPE),
    },
    colProps: { span: 8 },
  },
  {
    label: '应用名',
    field: 'applicationName',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '错误码编码',
    field: 'code',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '错误码提示',
    field: 'message',
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

export const formSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input',
  },
  {
    label: '应用名',
    field: 'applicationName',
    required: true,
    component: 'Input',
  },
  {
    label: '错误码编码',
    field: 'code',
    required: true,
    component: 'Input',
  },
  {
    label: '错误码提示',
    field: 'message',
    required: true,
    component: 'Input',
  },
  {
    label: '备注',
    field: 'memo',
    component: 'InputTextArea',
  },
]
