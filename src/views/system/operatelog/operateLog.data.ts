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
    title: '操作模块',
    dataIndex: 'module',
    width: 200,
  },
  {
    title: '操作名',
    dataIndex: 'name',
    width: 180,
  },
  {
    title: '操作类型',
    dataIndex: 'type',
    width: 120,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_OPERATE_TYPE)
    },
  },
  {
    title: '操作人',
    dataIndex: 'userNickname',
    width: 120,
  },
  // {
  //   title: 'userAgent',
  //   dataIndex: 'userAgent',
  //   width: 400
  // },
  {
    title: '请求路径',
    dataIndex: 'requestUrl',
  },
  {
    title: '操作结果',
    dataIndex: 'resultCode',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderTag(text === 0 ? '成功' : '失败', text === 0 ? '#87d068' : '#f50')
    },
  },
  {
    title: '执行时长',
    dataIndex: 'duration',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderText(text, 'ms')
    },
  },
  {
    title: '操作日期',
    dataIndex: 'startTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '系统模块',
    field: 'title',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '操作人员',
    field: 'operName',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '类型',
    field: 'type',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_OPERATE_TYPE),
    },
    colProps: { span: 8 },
  },
  {
    label: '状态',
    field: 'success',
    component: 'Select',
    componentProps: {
      options: [
        { value: true, key: true, label: '成功' },
        { value: false, key: false, label: '失败' },
      ],
    },
    colProps: { span: 8 },
  },
  {
    label: '操作时间',
    field: 'startTime',
    component: 'RangePicker',
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
    field: 'module',
    label: '操作模块',
  },
  {
    field: 'name',
    label: '操作名',
  },
  {
    field: 'userNickname',
    label: '操作人',
    render(_, data) {
      const { userNickname, userId } = data
      // return useRender.renderText(userNickname, 'uid: ' + userId)
      return useRender.renderTags([userNickname, `uid: ${userId}`])
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
    field: 'startTime',
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
    field: 'javaMethod',
    label: '操作方法',
    labelMinWidth: 80,
  },
  {
    field: 'javaMethodArgs',
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
    field: 'duration',
    label: '请求耗时',
    render(value) {
      return useRender.renderText(value, 'ms')
    },
  },
]
