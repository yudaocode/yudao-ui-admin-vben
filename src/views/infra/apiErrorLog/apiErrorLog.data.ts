import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

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
    title: '异常发生时间',
    dataIndex: 'exceptionTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    }
  },
  {
    title: '异常名',
    dataIndex: 'exceptionName',
    width: 250
  },
  {
    title: '处理状态',
    dataIndex: 'processStatus',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS)
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
    label: '用户名称',
    field: 'username',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '用户类型',
    field: 'userType',
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.USER_TYPE)
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
    label: '异常时间',
    field: 'exceptionTime',
    component: 'RangePicker',
    colProps: { span: 8 }
  },
  {
    label: '处理状态',
    field: 'processStatus',
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS)
    },
    colProps: { span: 8 }
  }
]
