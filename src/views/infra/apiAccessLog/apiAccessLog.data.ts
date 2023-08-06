import { h } from 'vue'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import type { DescItem } from '@/components/Description/index'

export const columns: BasicColumn[] = [
  {
    title: '日志编号',
    dataIndex: 'id',
    width: 100,
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
    title: '应用名',
    dataIndex: 'applicationName',
    width: 120,
  },
  {
    title: '请求方法名',
    dataIndex: 'requestMethod',
    width: 120,
  },
  {
    title: '请求地址',
    dataIndex: 'requestUrl',
    width: 250,
  },
  {
    title: '请求时间',
    dataIndex: 'beginTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '执行时长',
    dataIndex: 'duration',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderText(text.toString(), 'ms')
    },
  },
  {
    title: '操作结果',
    dataIndex: 'status',
    width: 180,
    ellipsis: true,
    customRender: ({ record }) => {
      const success = record.resultCode === 0
      return useRender.renderTag(success ? '成功' : '失败', success ? '#87d068' : '#f50')
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
    label: '用户类型',
    field: 'userType',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.USER_TYPE),
    },
    colProps: { span: 8 },
  },
  {
    label: '应用名',
    field: 'applicationName',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '请求地址',
    field: 'requestUrl',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '请求时间',
    field: 'beginTime',
    component: 'RangePicker',
    colProps: { span: 8 },
  },
  {
    label: '执行时长',
    field: 'duration',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '结果码',
    field: 'resultCode',
    component: 'Input',
    colProps: { span: 8 },
  },
]

const httpMethods = [
  { value: 'GET', color: '#108ee9' },
  { value: 'POST', color: '#2db7f5' },
  { value: 'PUT', color: 'warning' },
  { value: 'DELETE', color: '#f50' },
]

export const infoSchema: DescItem[] = [
  {
    label: '日志id',
    field: 'id',
  },
  {
    label: '链路id',
    field: 'traceId',
    show: data => data && data.traceId && data.traceId !== '',
  },
  {
    label: '应用名称',
    field: 'applicationName',
    labelMinWidth: 100,
  },
  {
    field: 'userId',
    label: '用户id',
    render(value, data) {
      const tag = useRender.renderDict(data.userType, DICT_TYPE.USER_TYPE)
      const uidTag = useRender.renderTag(`uid: ${value}`)
      return h('span', {}, [tag, uidTag])
    },
  },
  {
    field: 'resultCode',
    label: '请求结果',
    render(value) {
      return useRender.renderTag(value === 0 ? '成功' : '失败', value === 0 ? '#87d068' : '#f50')
    },
  },
  {
    field: 'resultMsg',
    label: '响应信息',
    show(data) {
      return data && data.resultMsg && data.resultMsg !== ''
    },
    render(value) {
      return h('span', { style: { color: 'red', fontWeight: 'bold' } }, value)
    },
  },
  {
    field: 'userIp',
    label: '请求ip',
  },
  {
    field: 'userAgent',
    label: 'userAgent',
  },
  {
    field: 'beginTime',
    label: '请求时间',
    render(value) {
      return useRender.renderDate(value)
    },
  },
  {
    field: 'requestUrl',
    label: '请求路径',
    render(_, data) {
      if (!data)
        return ''

      const { requestMethod, requestUrl } = data
      const current = httpMethods.find(item => item.value === requestMethod.toUpperCase())
      const methodTag = current ? useRender.renderTag(requestMethod, current.color) : requestMethod
      return h('span', {}, [methodTag, requestUrl])
    },
  },
  {
    field: 'requestParams',
    label: '请求参数',
    render(value) {
      return useRender.renderJsonPreview(value)
    },
  },
  {
    field: 'beginTime',
    label: '请求开始时间',
    render(value) {
      return useRender.renderDate(value)
    },
  },
  {
    field: 'endTime',
    label: '请求结束时间',
    render(value) {
      return useRender.renderDate(value)
    },
  },
  {
    field: 'duration',
    label: '请求耗时',
    render(value) {
      // 为0的话需要转为string  否则不会显示
      return useRender.renderText(String(value), 'ms')
    },
  },
]
