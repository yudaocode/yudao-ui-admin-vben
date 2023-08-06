import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '文件名',
    dataIndex: 'name',
    width: 200,
  },
  {
    title: '文件 URL',
    dataIndex: 'url',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderImg(text)
    },
  },
  {
    title: '文件路径',
    dataIndex: 'path',
    width: 180,
  },
  {
    title: '文件大小',
    dataIndex: 'size',
    width: 120,
    customRender: ({ text }) => {
      const unitArr = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      const srcSize = Number.parseFloat(text)
      const index = Math.floor(Math.log(srcSize) / Math.log(1024))
      const size = srcSize / 1024 ** index
      return `${size.toFixed(2)} ${unitArr[index]}`
    },
  },
  {
    title: '文件类型',
    dataIndex: 'type',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderTag(text)
    },
  },
  {
    title: '文件内容',
    dataIndex: 'content',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderImg(text)
    },
  },
  {
    title: '上传时间',
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '文件路径',
    field: 'path',
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
