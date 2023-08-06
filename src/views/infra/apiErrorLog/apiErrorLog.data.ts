import { Textarea } from 'ant-design-vue'
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
    title: '异常发生时间',
    dataIndex: 'exceptionTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '异常名',
    dataIndex: 'exceptionName',
    width: 250,
  },
  {
    title: '处理状态',
    dataIndex: 'processStatus',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS)
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
    label: '用户名称',
    field: 'username',
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
    label: '异常时间',
    field: 'exceptionTime',
    component: 'RangePicker',
    colProps: { span: 8 },
  },
  {
    label: '处理状态',
    field: 'processStatus',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS),
    },
    colProps: { span: 8 },
  },
]

function renderText(value: string, color: string, bold = true) {
  return h('span', { style: { color, fontWeight: bold ? 'bold' : 'normal' } }, value)
}

const httpMethods = [
  { value: 'GET', color: '#108ee9' },
  { value: 'POST', color: '#2db7f5' },
  { value: 'PUT', color: 'warning' },
  { value: 'DELETE', color: '#f50' },
]

export const infoSchema: DescItem[] = [
  {
    field: 'id',
    label: '异常id',
  },
  {
    field: 'traceId',
    label: '链路ID',
    show(data) {
      return data && data.traceId && data.traceId !== ''
    },
  },
  {
    field: 'applicationName',
    label: '应用名称',
    labelMinWidth: 100,
  },
  {
    field: 'processStatus',
    label: '处理状态',
    render(_, data) {
      const { processStatus, processUserId } = data
      const tag = useRender.renderDict(processStatus, DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS)
      if (!processUserId)
        return tag

      const uidTag = useRender.renderTag(`uid: ${processUserId}`)
      return h('span', {}, [tag, uidTag])
    },
  },
  {
    field: 'processTime',
    label: '处理时间',
    show(data) {
      return data && data.processTime && data.processTime !== ''
    },
    render(value) {
      return useRender.renderDate(value)
    },
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
    field: 'userIp',
    label: 'ip地址',
  },
  {
    field: 'requestUrl',
    label: '请求地址',
    render(_, data) {
      if (data) {
        const { requestMethod } = data
        const current = httpMethods.find(item => item.value === requestMethod)
        const tag = current ? useRender.renderTag(requestMethod, current.color) : requestMethod
        return h('span', {}, [tag, data.requestUrl])
      }
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
    field: 'userAgent',
    label: 'userAgent',
  },
  {
    field: 'exceptionTime',
    label: '异常时间',
    render(value) {
      return useRender.renderDate(value)
    },
  },
  {
    field: 'exceptionClassName',
    label: '异常类名/方法',
    render(_, data) {
      if (data)
        return renderText(`${data.exceptionClassName} / ${data.exceptionMethodName}`, 'red')
    },
  },
  {
    field: 'exceptionMessage',
    label: '异常信息',
    render(value) {
      return renderText(value, 'red')
    },
  },
  {
    field: 'exceptionFileName',
    label: '异常文件名',
    render(_, data) {
      if (data)
        return useRender.renderText(data.exceptionFileName, `Line: ${data.exceptionLineNumber}`)
    },
  },
  {
    field: 'exceptionName',
    label: '异常名称',
  },
  {
    field: 'exceptionRootCauseMessage',
    label: '异常信息',
  },
  {
    field: 'exceptionStackTrace',
    label: '异常堆栈',
    render(value) {
      return h(Textarea, { value, readonly: true, style: { minHeight: '300px' } })
    },
  },
]
