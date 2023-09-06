import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
  },
  {
    title: '等级图标',
    dataIndex: 'icon',
    customRender: ({ text }) => {
      return useRender.renderImg(text)
    },
  },
  {
    title: '等级背景图',
    dataIndex: 'remark',
    customRender: ({ text }) => {
      return useRender.renderImg(text)
    },
  },
  {
    title: '等级名称',
    dataIndex: 'name',
  },
  {
    title: '等级',
    dataIndex: 'level',
  },
  {
    title: '升级经验',
    dataIndex: 'experience',
  },
  {
    title: '享受折扣(%)',
    dataIndex: 'discountPercent',
  },
  {
    title: '状态',
    dataIndex: 'status',
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
    label: '等级名称',
    field: 'name',
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
    label: '等级名称',
    field: 'name',
    required: true,
    component: 'Input',
  },
  {
    label: '等级',
    field: 'level',
    required: true,
    component: 'InputNumber',
  },
  {
    label: '升级经验',
    field: 'experience',
    required: true,
    component: 'InputNumber',
  },
  {
    label: '享受折扣(%)',
    field: 'discountPercent',
    required: true,
    component: 'InputNumber',
  },
  {
    label: '等级图标',
    field: 'icon',
    component: 'FileUpload',
    componentProps: {
      maxCount: 1,
      fileType: 'image',
    },
  },
  {
    label: '背景图',
    field: 'backgroundUrl',
    component: 'FileUpload',
    componentProps: {
      maxCount: 1,
      fileType: 'image',
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
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
  },
]
