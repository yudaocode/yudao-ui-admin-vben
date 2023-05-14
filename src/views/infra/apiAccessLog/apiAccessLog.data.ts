import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '日志编号',
    dataIndex: 'id',
    width: 100
  },
  {
    title: '用户编号',
    dataIndex: 'userId',
    width: 100
  },
  {
    title: '用户类型',
    dataIndex: 'userType',
    width: 120,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.USER_TYPE)
    }
  },
  {
    title: '应用名',
    dataIndex: 'applicationName',
    width: 120
  },
  {
    title: '请求方法名',
    dataIndex: 'requestMethod',
    width: 120
  },
  {
    title: '请求地址',
    dataIndex: 'requestUrl',
    width: 250
  },
  {
    title: '请求时间',
    dataIndex: 'beginTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    }
  },
  {
    title: '执行时长',
    dataIndex: 'duration',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderText(text, 'ms')
    }
  },
  {
    title: '操作结果',
    dataIndex: 'status',
    width: 180,
    customRender: ({ record }) => {
      return useRender.renderTag(record.resultCode === 0 ? '成功' : '失败(' + record.resultMsg + ')')
    }
  }
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '用户编号',
    field: 'userId',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '用户类型',
    field: 'userType',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.USER_TYPE)
    },
    colProps: { span: 8 }
  },
  {
    label: '应用名',
    field: 'applicationName',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '请求地址',
    field: 'requestUrl',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '请求时间',
    field: 'beginTime',
    component: 'RangePicker',
    colProps: { span: 8 }
  },
  {
    label: '执行时长',
    field: 'duration',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '结果码',
    field: 'resultCode',
    component: 'Input',
    colProps: { span: 8 }
  }
]
