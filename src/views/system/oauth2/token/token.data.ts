import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '访问令牌',
    dataIndex: 'accessToken',
    width: 300,
  },
  {
    title: '刷新令牌',
    dataIndex: 'refreshToken',
    width: 300,
  },
  {
    title: '用户编号',
    dataIndex: 'userId',
    width: 100,
  },
  {
    title: '用户类型',
    dataIndex: 'userType',
    width: 120,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.USER_TYPE)
    },
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '过期时间',
    dataIndex: 'expiresTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '用户编号',
    field: 'userId',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '客户端编号',
    field: 'clientId',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '用户类型',
    field: 'userType',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.USER_TYPE),
    },
    colProps: { span: 8 },
  },
]
