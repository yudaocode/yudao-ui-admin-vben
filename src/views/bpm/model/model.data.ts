import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '编号',
    dataIndex: 'id',
    width: 100
  },
  {
    title: '流程标识',
    dataIndex: 'key',
    width: 180
  },
  {
    title: '流程名称',
    dataIndex: 'name',
    width: 200
  },
  {
    title: '流程分类',
    dataIndex: 'category',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.BPM_MODEL_CATEGORY, 'string')
    }
  },
  {
    title: '表单信息',
    dataIndex: 'formType',
    width: 200
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    }
  }
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '流程标识',
    field: 'key',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '流程名称',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '流程分类',
    field: 'category',
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.BPM_MODEL_CATEGORY)
    },
    colProps: { span: 8 }
  }
]

export const formSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input'
  },
  {
    label: '流程标识',
    field: 'key',
    required: true,
    component: 'Input',
    dynamicDisabled: ({ values }) => !!values.id
  },
  {
    label: '流程名称',
    field: 'name',
    required: true,
    component: 'Input',
    dynamicDisabled: ({ values }) => !!values.id
  },
  {
    label: '流程分类',
    field: 'category',
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.BPM_MODEL_CATEGORY)
    }
  },
  {
    label: '流程描述',
    field: 'description',
    component: 'InputTextArea'
  }
]
