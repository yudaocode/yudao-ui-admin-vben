import { getTenantPackageList } from '@/api/system/tenantPackage'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '租户编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '租户名',
    dataIndex: 'name',
    width: 180,
  },
  {
    title: '租户套餐',
    dataIndex: 'packageId',
    width: 100,
  },
  {
    title: '联系人',
    dataIndex: 'contactName',
    width: 120,
  },
  {
    title: '联系手机',
    dataIndex: 'contactMobile',
    width: 120,
  },
  {
    title: '账号额度',
    dataIndex: 'accountCount',
    width: 120,
    customRender: ({ text }) => {
      return useRender.renderTag(text)
    },
  },
  {
    title: '过期时间',
    dataIndex: 'expireTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '绑定域名',
    dataIndex: 'domain',
    width: 200,
  },
  {
    title: '租户状态',
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
    label: '租户名',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '联系人',
    field: 'contactName',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '联系手机',
    field: 'contactMobile',
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
    label: '租户名',
    field: 'name',
    required: true,
    component: 'Input',
  },
  {
    label: '租户套餐',
    field: 'packageId',
    required: true,
    component: 'ApiSelect',
    componentProps: {
      api: () => getTenantPackageList(),
      labelField: 'name',
      valueField: 'id',
    },
  },
  {
    label: '联系人',
    field: 'contactName',
    required: true,
    component: 'Input',
  },
  {
    label: '联系手机',
    field: 'contactMobile',
    component: 'Input',
  },
  {
    label: '用户名称',
    field: 'username',
    component: 'Input',
    ifShow: ({ values }) => !values.id,
  },
  {
    label: '用户密码',
    field: 'password',
    component: 'InputPassword',
    ifShow: ({ values }) => !values.id,
  },
  {
    label: '账号额度',
    field: 'accountCount',
    required: true,
    defaultValue: 0,
    component: 'InputNumber',
  },
  {
    label: '过期时间',
    field: 'expireTime',
    required: true,
    component: 'DatePicker',
    componentProps: {
      showTime: true,
      format: 'YYYY-MM-DD HH:mm:ss',
      valueFormat: 'x',
    },
  },
  {
    label: '绑定域名',
    field: 'domain',
    required: true,
    component: 'Input',
  },
  {
    label: '租户状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS),
    },
  },
]
