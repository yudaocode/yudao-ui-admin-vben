import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    defaultHidden: true,
    width: 100,
  },
  {
    title: '名称',
    dataIndex: 'name',
    width: 180,
  },
  {
    title: '微信号',
    dataIndex: 'account',
    width: 100,
  },
  {
    title: 'appId',
    dataIndex: 'appId',
    width: 120,
  },
  {
    title: '服务器地址(URL)',
    dataIndex: 'appIdURL',
    width: 120,
    customRender: ({ record }) => {
      return `http://服务端地址/mp/open/${record.appId}`
    },
  },
  {
    title: '二维码',
    dataIndex: 'qrCodeUrl',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderImg(text)
    },
  },
  {
    title: '备注',
    dataIndex: 'remark',
    width: 180,
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '名称',
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
    label: '名称',
    field: 'name',
    required: true,
    component: 'Input',
  },
  {
    label: '微信号',
    field: 'account',
    helpMessage: '在微信公众平台（mp.weixin.qq.com）的菜单 [设置与开发 - 公众号设置 - 账号详情] 中能找到「微信号」',
    required: true,
    component: 'Input',
  },
  {
    label: '公众号 appId',
    field: 'appId',
    helpMessage: '在微信公众平台（mp.weixin.qq.com）的菜单 [设置与开发 - 公众号设置 - 基本设置] 中能找到「开发者ID(AppID)」',
    required: true,
    component: 'Input',
  },
  {
    label: '公众号 appSecret',
    field: 'appSecret',
    helpMessage: '在微信公众平台（mp.weixin.qq.com）的菜单 [设置与开发 - 公众号设置 - 基本设置] 中能找到「开发者密码(AppSecret)」',
    required: true,
    component: 'Input',
  },
  {
    label: '公众号token',
    field: 'token',
    required: true,
    component: 'Input',
  },
  {
    label: '消息加解密密钥',
    field: 'aesKey',
    required: true,
    component: 'Input',
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
  },
]
