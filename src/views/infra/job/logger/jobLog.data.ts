import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '日志编号',
    dataIndex: 'id',
    width: 100
  },
  {
    title: '任务编号',
    dataIndex: 'jobId',
    width: 180
  },
  {
    title: '处理器的名字',
    dataIndex: 'handlerName',
    width: 180
  },
  {
    title: '处理器的参数',
    dataIndex: 'handlerParam',
    width: 180
  },
  {
    title: '第几次执行',
    dataIndex: 'executeIndex',
    width: 100
  },
  {
    title: '执行时间',
    dataIndex: 'beginTime',
    width: 180,
    customRender: ({ record }) => {
      return useRender.renderDate(record.beginTime) + ' ~ ' + useRender.renderDate(record.endTime)
    }
  },
  {
    title: '执行时长',
    dataIndex: 'duration',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderText(text, ' 毫秒')
    }
  },
  {
    title: '任务状态',
    dataIndex: 'status',
    width: 180,
    customRender: ({ record }) => {
      return useRender.renderDict(record.beginTime, DICT_TYPE.INFRA_JOB_LOG_STATUS)
    }
  }
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '处理器的名字',
    field: 'handlerName',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '开始执行时间',
    field: 'beginTime',
    component: 'DatePicker',
    colProps: { span: 8 }
  },
  {
    label: '结束执行时间',
    field: 'endTime',
    component: 'DatePicker',
    colProps: { span: 8 }
  },
  {
    label: '任务状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.INFRA_JOB_STATUS)
    },
    colProps: { span: 8 }
  },
  {
    label: '处理器的名字',
    field: 'handlerName',
    component: 'Input',
    colProps: { span: 8 }
  }
]

export const formSchema: FormSchema[] = [
  {
    label: '任务编号',
    field: 'id',
    show: false,
    component: 'Input'
  },
  {
    label: '任务名称',
    field: 'name',
    required: true,
    component: 'Input'
  },
  {
    label: '处理器的名字',
    field: 'handlerName',
    required: true,
    dynamicDisabled: ({ values }) => !!values.id,
    component: 'Input'
  },
  {
    label: '处理器的参数',
    field: 'handlerParam',
    component: 'Input'
  },
  {
    label: 'CRON 表达式',
    field: 'cronExpression',
    required: true,
    component: 'Input'
  },
  {
    label: '重试次数',
    field: 'retryCount',
    required: true,
    helpMessage: '设置为 0 时，不进行重试',
    defaultValue: 0,
    component: 'InputNumber'
  },
  {
    label: '重试间隔',
    field: 'retryInterval',
    required: true,
    helpMessage: '单位：毫秒。设置为 0 时，无需间隔',
    defaultValue: 0,
    component: 'InputNumber',
    suffix: '毫秒'
  },
  {
    label: '监控超时时间',
    field: 'monitorTimeout',
    component: 'Input',
    suffix: '毫秒'
  }
]
