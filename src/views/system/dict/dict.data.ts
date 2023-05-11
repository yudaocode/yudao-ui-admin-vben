import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE, getDictOpts } from '@/utils/dict'

export const dataColumns: BasicColumn[] = [
  {
    title: '字典编码',
    dataIndex: 'id',
    width: 100
  },
  {
    title: '字典标签',
    dataIndex: 'label',
    width: 180
  },
  {
    title: '字典键值',
    dataIndex: 'value',
    width: 100
  },
  {
    title: '字典排序',
    dataIndex: 'sort',
    width: 120
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.COMMON_STATUS)
    }
  },
  {
    title: '颜色类型',
    dataIndex: 'colorType',
    width: 180
  },
  {
    title: 'CSS Class',
    dataIndex: 'cssClass',
    width: 180
  },
  {
    title: '备注',
    dataIndex: 'remark',
    width: 180
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

export const dataSearchFormSchema: FormSchema[] = [
  {
    label: '字典标签',
    field: 'label',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOpts(DICT_TYPE.COMMON_STATUS)
    },
    colProps: { span: 8 }
  }
]

export const dataFormSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input'
  },
  {
    label: '字典类型',
    field: 'dictType',
    required: true,
    component: 'Input',
    dynamicDisabled: ({ values }) => !!values.dictType
  },
  {
    label: '数据标签',
    field: 'label',
    required: true,
    component: 'Input'
  },
  {
    label: '数据键值',
    field: 'value',
    required: true,
    component: 'Input'
  },
  {
    label: '显示排序',
    field: 'sort',
    required: true,
    defaultValue: 0,
    component: 'InputNumber'
  },
  {
    label: '状态',
    field: 'status',
    component: 'Select',
    defaultValue: 0,
    componentProps: {
      options: getDictOpts(DICT_TYPE.COMMON_STATUS)
    }
  },
  {
    label: '颜色类型',
    field: 'colorType',
    component: 'Select',
    componentProps: {
      options: [
        {
          value: '',
          label: '空'
        },
        {
          value: 'processing',
          label: '主要'
        },
        {
          value: 'success',
          label: '成功'
        },
        {
          value: 'default',
          label: '默认'
        },
        {
          value: 'warning',
          label: '警告'
        },
        {
          value: 'error',
          label: '危险'
        },
        {
          value: 'pink',
          label: 'pink'
        },
        {
          value: 'red',
          label: 'red'
        },
        {
          value: 'orange',
          label: 'orange'
        },
        {
          value: 'green',
          label: 'green'
        },
        {
          value: 'cyan',
          label: 'cyan'
        },
        {
          value: 'blue',
          label: 'blue'
        },
        {
          value: 'purple',
          label: 'purple'
        }
      ]
    }
  },
  {
    label: 'CSS Class',
    field: 'cssClass',
    component: 'Input',
    helpMessage: '输入hex模式的颜色，例如#108ee9'
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea'
  }
]
