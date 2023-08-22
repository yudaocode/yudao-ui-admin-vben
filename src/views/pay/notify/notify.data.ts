import { getAppList } from '@/api/pay/app'
import type { DescItem } from '@/components/Description'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '任务编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '应用编号',
    dataIndex: 'appName',
    width: 200,
  },
  {
    title: '商户订单编号',
    dataIndex: 'merchantOrderId',
    width: 200,
  },
  {
    title: '通知类型',
    dataIndex: 'type',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.PAY_NOTIFY_TYPE)
    },
  },
  {
    title: '关联编号',
    dataIndex: 'dataId',
    width: 200,
  },
  {
    title: '通知状态',
    dataIndex: 'status',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.PAY_NOTIFY_STATUS)
    },
  },
  {
    title: '最后通知时间',
    dataIndex: 'lastExecuteTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '下次通知时间',
    dataIndex: 'nextNotifyTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '最大通知次数',
    dataIndex: 'maxNotifyTimes',
    width: 120,
    ifShow: false,
  },
  {
    title: '通知次数',
    dataIndex: 'notifyTimes',
    width: 120,
    customRender: ({ record, text }) => {
      return useRender.renderTag(`${text}/${record.maxNotifyTimes}`)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '应用编号',
    field: 'appId',
    component: 'ApiSelect',
    componentProps: {
      api: () => getAppList(),
      labelField: 'name',
      valueField: 'id',
    },
    colProps: { span: 8 },
  },
  {
    label: '通知类型',
    field: 'type',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.PAY_NOTIFY_TYPE, 'number'),
    },
    colProps: { span: 8 },
  },
  {
    label: '关联编号',
    field: 'dataId',
    component: 'Input',
    colProps: { span: 8 },
  },

  {
    label: '通知状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.PAY_NOTIFY_STATUS),
    },
    colProps: { span: 8 },
  },
  {
    label: '商户订单编号',
    field: 'merchantOrderId',
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

export const descSchema: DescItem[] = [
  {
    label: '商户订单编号',
    field: 'merchantOrderId',
  },
  {
    label: '通知状态',
    field: 'status',
    render: (curVal) => {
      return useRender.renderDict(curVal, DICT_TYPE.PAY_NOTIFY_STATUS)
    },
  },
  {
    label: '应用编号',
    field: 'appId',
  },
  {
    label: '应用名称',
    field: 'appName',
  },
  {
    label: '关联编号',
    field: 'dataId',
  },
  {
    label: '通知类型',
    field: 'type',
    render: (curVal) => {
      return useRender.renderDict(curVal, DICT_TYPE.PAY_NOTIFY_TYPE)
    },
  },
  {
    label: '通知次数',
    field: 'notifyTimes',
  },
  {
    label: '最大通知次数',
    field: 'maxNotifyTimes',
  },
  {
    label: '最后通知时间',
    field: 'lastExecuteTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    },
  },
  {
    label: '下次通知时间',
    field: 'nextNotifyTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    },
  },
  {
    label: '创建时间',
    field: 'createTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    },
  },
  {
    label: '更新时间',
    field: 'updateTime',
    render: (curVal) => {
      return useRender.renderDate(curVal)
    },
  },
]

export const descColumns: BasicColumn[] = [
  {
    title: '日志编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '通知状态',
    dataIndex: 'status',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.PAY_NOTIFY_STATUS)
    },
  },
  {
    title: '通知次数',
    dataIndex: 'notifyTimes',
    width: 100,
  },
  {
    title: '通知时间',
    dataIndex: 'lastExecuteTime',
    width: 100,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '响应结果',
    dataIndex: 'response',
    width: 100,
  },
]
