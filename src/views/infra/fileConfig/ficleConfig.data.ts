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
    title: '配置名',
    dataIndex: 'name',
    width: 180,
  },
  {
    title: '存储器',
    dataIndex: 'storage',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.INFRA_FILE_STORAGE)
    },
  },
  {
    title: '主配置',
    dataIndex: 'master',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.INFRA_BOOLEAN_STRING)
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
    label: '配置名',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '存储器',
    field: 'storage',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.INFRA_FILE_STORAGE),
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
    label: '配置名',
    field: 'name',
    required: true,
    component: 'Input',
  },
  {
    label: '存储器',
    field: 'storage',
    component: 'Select',
    required: true,
    dynamicDisabled: ({ values }) => !!values.id,
    componentProps: {
      options: getDictOptions(DICT_TYPE.INFRA_FILE_STORAGE),
    },
  },
  {
    label: '基础路径',
    field: 'config.basePath',
    required: true,
    ifShow: ({ values }) => values.storage >= 10 && values.storage <= 12,
    component: 'Input',
  },
  {
    label: '主机地址',
    field: 'config.host',
    required: true,
    ifShow: ({ values }) => values.storage >= 11 && values.storage <= 12,
    component: 'Input',
  },
  {
    label: '主机端口',
    field: 'config.port',
    required: true,
    ifShow: ({ values }) => values.storage >= 11 && values.storage <= 12,
    component: 'Input',
  },
  {
    label: '用户名',
    field: 'config.username',
    required: true,
    ifShow: ({ values }) => values.storage >= 11 && values.storage <= 12,
    component: 'Input',
  },
  {
    label: '密码',
    field: 'config.password',
    required: true,
    ifShow: ({ values }) => values.storage >= 11 && values.storage <= 12,
    component: 'Input',
  },
  {
    label: '连接模式',
    field: 'config.basePath',
    required: true,
    ifShow: ({ values }) => values.storage === 11,
    component: 'Select',
    componentProps: {
      options: [
        { lable: '主动模式', key: 'Active', value: 'Active' },
        { lable: '被动模式', key: 'Passive', value: 'Passive' },
      ],
    },
  },
  {
    label: '节点地址',
    field: 'config.endpoint',
    required: true,
    ifShow: ({ values }) => values.storage === 20,
    component: 'Input',
  },
  {
    label: '存储 bucket',
    field: 'config.bucket',
    required: true,
    ifShow: ({ values }) => values.storage === 20,
    component: 'Input',
  },
  {
    label: 'accessKey',
    field: 'config.accessKey',
    ifShow: ({ values }) => values.storage === 20,
    component: 'Input',
  },
  {
    label: 'accessSecret',
    field: 'config.accessSecret',
    ifShow: ({ values }) => values.storage === 20,
    component: 'Input',
  },
  {
    label: '自定义域名',
    field: 'config.domain',
    required: true,
    component: 'Input',
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
  },
]
