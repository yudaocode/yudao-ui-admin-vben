import { getSimpleAccounts } from '@/api/mp/account'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '标签名称',
    dataIndex: 'name',
    width: 180,
  },
  {
    title: '粉丝数',
    dataIndex: 'count',
    width: 100,
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

const simpleAccountsOptinos = await getSimpleAccounts()

export const searchFormSchema: FormSchema[] = [
  {
    label: '公众号',
    field: 'accountId',
    component: 'Select',
    required: true,
    defaultValue: simpleAccountsOptinos[0].id,
    componentProps: {
      options: simpleAccountsOptinos,
      fieldNames: {
        label: 'name',
        value: 'id',
      },
    },
    colProps: { span: 8 },
  },
  {
    label: '标签名称',
    field: 'name',
    component: 'Input',
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
    label: '标签名称',
    field: 'name',
    required: true,
    component: 'Input',
  },
]
