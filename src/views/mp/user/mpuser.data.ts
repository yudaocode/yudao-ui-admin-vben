import { getSimpleAccounts } from '@/api/mp/account'
import { getSimpleTags } from '@/api/mp/tag'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '用户标识',
    dataIndex: 'openid',
    width: 180,
  },
  {
    title: '昵称',
    dataIndex: 'nickname',
    width: 100,
  },
  {
    title: '备注',
    dataIndex: 'remark',
    width: 120,
  },
  {
    title: '标签',
    dataIndex: 'tagIds',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderTags(text)
    },
  },
  {
    title: '订阅状态',
    dataIndex: 'subscribeStatus',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderTag(text === 0 ? '已订阅' : '未订阅', text === 0 ? 'purple' : 'orange')
    },
  },
  {
    title: '订阅时间',
    dataIndex: 'subscribeTime',
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
    label: '用户标识',
    field: 'openid',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '昵称',
    field: 'nickname',
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
    label: '昵称',
    field: 'nickname',
    required: true,
    component: 'Input',
  },
  {
    label: '备注',
    field: 'remark',
    required: true,
    component: 'Input',
  },
  {
    label: '标签',
    field: 'tagIds',
    helpMessage: '在微信公众平台（mp.weixin.qq.com）的菜单 [设置与开发 - 公众号设置 - 基本设置] 中能找到「开发者ID(AppID)」',
    required: true,
    defaultValue: [],
    component: 'ApiSelect',
    componentProps: {
      api: () => getSimpleTags(),
      labelField: 'name',
      valueField: 'tagId',
      mode: 'tags',
    },
  },
]
