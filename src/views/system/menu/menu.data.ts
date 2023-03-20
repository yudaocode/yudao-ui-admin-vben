import Icon from '@/components/Icon'
import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { h } from 'vue'

export const columns: BasicColumn[] = [
  {
    title: '菜单名称',
    dataIndex: 'name',
    width: 250,
    align: 'left'
  },
  {
    title: '图标',
    dataIndex: 'icon',
    width: 100,
    customRender: ({ record }) => {
      return h(Icon, { icon: record.icon })
    }
  },
  {
    title: '排序',
    dataIndex: 'sort',
    width: 60
  },
  {
    title: '权限标识',
    dataIndex: 'permission',
    width: 120
  },
  {
    title: '组件路径',
    dataIndex: 'component',
    width: 120
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.COMMON_STATUS)
    }
  }
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '菜单名称',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS)
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
    label: '岗位名称',
    field: 'name',
    required: true,
    component: 'Input'
  },
  {
    label: '岗位编码',
    field: 'code',
    required: true,
    component: 'Input'
  },
  {
    label: '岗位顺序',
    field: 'sort',
    required: true,
    component: 'InputNumber'
  },
  {
    label: '状态',
    field: 'status',
    component: 'Select',
    defaultValue: 0,
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS)
    }
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea'
  }
]
