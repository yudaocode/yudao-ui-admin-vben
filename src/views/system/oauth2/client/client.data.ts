import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '客户端编号',
    dataIndex: 'clientId',
    width: 200,
  },
  {
    title: '客户端密钥',
    dataIndex: 'secret',
    width: 100,
  },
  {
    title: '应用名',
    dataIndex: 'name',
    width: 100,
  },
  {
    title: '应用图标',
    dataIndex: 'logo',
    width: 120,
    customRender: ({ text }) => {
      return useRender.renderImg(text)
    },
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
    title: '访问令牌的有效期',
    dataIndex: 'accessTokenValiditySeconds',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderText(text, '秒')
    },
  },
  {
    title: '刷新令牌的有效期',
    dataIndex: 'refreshTokenValiditySeconds',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderText(text, '秒')
    },
  },
  {
    title: '授权类型',
    dataIndex: 'authorizedGrantTypes',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderTags(text)
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
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '应用名',
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
    label: '客户端编号',
    field: 'clientId',
    required: true,
    component: 'Input',
  },
  {
    label: '客户端密钥',
    field: 'secret',
    required: true,
    component: 'Input',
  },
  {
    label: '应用名',
    field: 'name',
    required: true,
    component: 'Input',
  },
  {
    label: '应用图标',
    field: 'logo',
    required: true,
    component: 'FileUpload',
    componentProps: {
      fileType: 'image',
      maxCount: 1,
    },
  },
  {
    label: '应用描述',
    field: 'description',
    component: 'InputTextArea',
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
    label: '访问令牌的有效期',
    field: 'accessTokenValiditySeconds',
    required: true,
    defaultValue: 0,
    component: 'InputNumber',
  },
  {
    label: '刷新令牌的有效期',
    field: 'refreshTokenValiditySeconds',
    required: true,
    defaultValue: 0,
    component: 'InputNumber',
  },
  {
    label: '授权类型',
    field: 'authorizedGrantTypes',
    required: true,
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_OAUTH2_GRANT_TYPE, 'string'),
      mode: 'multiple',
    },
  },
  {
    label: '授权范围',
    field: 'scopes',
    component: 'Select',
    componentProps: {
      mode: 'tags',
      options: [],
    },
  },
  {
    label: '自动授权范围',
    field: 'autoApproveScopes',
    component: 'Select',
    componentProps: {
      mode: 'tags',
      options: [],
    },
  },
  {
    label: '可重定向的 URI 地址',
    field: 'redirectUris',
    required: true,
    component: 'Select',
    componentProps: {
      mode: 'tags',
      options: [],
    },
  },
  {
    label: '权限',
    field: 'authorities',
    component: 'Select',
    componentProps: {
      mode: 'tags',
      options: [],
    },
  },
  {
    label: '资源',
    field: 'resourceIds',
    component: 'Select',
    componentProps: {
      mode: 'tags',
      options: [],
    },
  },
  {
    label: '附加信息',
    field: 'additionalInformation',
    component: 'InputTextArea',
  },
]
