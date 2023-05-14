import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '日志编号',
    dataIndex: 'id',
    width: 100
  },
  {
    title: '操作模块',
    dataIndex: 'module',
    width: 120
  },
  {
    title: '操作名',
    dataIndex: 'name',
    width: 180
  },
  {
    title: '操作类型',
    dataIndex: 'type',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_OPERATE_TYPE)
    }
  },
  {
    title: '操作人',
    dataIndex: 'userNickname',
    width: 120
  },
  {
    title: 'userAgent',
    dataIndex: 'userAgent',
    width: 400
  },
  {
    title: '操作结果',
    dataIndex: 'resultCode',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderTag(text === 0 ? '成功' : '失败')
    }
  },
  {
    title: '操作日期',
    dataIndex: 'startTime',
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
  }
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '系统模块',
    field: 'title',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '操作人员',
    field: 'operName',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '类型',
    field: 'type',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_OPERATE_TYPE)
    },
    colProps: { span: 8 }
  },
  {
    label: '状态',
    field: 'success',
    component: 'Select',
    componentProps: {
      options: [
        { value: true, key: true, label: '成功' },
        { value: false, key: false, label: '失败' }
      ]
    },
    colProps: { span: 8 }
  },
  {
    label: '操作时间',
    field: 'startTime',
    component: 'RangePicker',
    colProps: { span: 8 }
  }
]
