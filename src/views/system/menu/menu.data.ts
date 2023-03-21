import Icon from '@/components/Icon'
import { listSimpleMenusApi } from '@/api/system/menu'
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
    label: '上级菜单',
    field: 'parentId',
    required: true,
    component: 'ApiTreeSelect',
    componentProps: {
      api: () => listSimpleMenusApi(),
      fieldNames: {
        label: 'name',
        key: 'id',
        value: 'id'
      },
      handleTree: 'id'
    }
  },
  {
    label: '菜单类型',
    field: 'type',
    required: true,
    defaultValue: '0',
    component: 'RadioButtonGroup',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.SYSTEM_MENU_TYPE)
    },
    colProps: { lg: 24, md: 24 }
  },
  {
    label: '菜单名称',
    field: 'name',
    required: true,
    component: 'Input'
  },
  {
    label: '菜单图标',
    field: 'icon',
    component: 'IconPicker',
    ifShow: ({ values }) => values.type !== 3
  },
  {
    label: '显示排序',
    field: 'sort',
    required: true,
    component: 'Input'
  },
  {
    label: '路由地址',
    field: 'path',
    required: true,
    component: 'Input',
    ifShow: ({ values }) => values.type !== 3
  },
  {
    label: '权限标识',
    field: 'permission',
    component: 'Input',
    ifShow: ({ values }) => values.type !== 1
  },
  {
    label: '组件路径',
    field: 'component',
    component: 'Input',
    ifShow: ({ values }) => values.type === 2
  },
  {
    label: '组件名称',
    field: 'componentName',
    component: 'Input',
    ifShow: ({ values }) => values.type === 2
  },
  {
    label: '菜单状态',
    field: 'status',
    required: true,
    component: 'RadioButtonGroup',
    defaultValue: 0,
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS)
    }
  },
  {
    label: '显示状态',
    field: 'visible',
    component: 'RadioButtonGroup',
    componentProps: {
      options: [
        { label: true, key: true, value: '显示' },
        { label: false, key: false, value: '隐藏' }
      ]
    },
    ifShow: ({ values }) => values.type !== 3
  },
  {
    label: '总是显示',
    field: 'alwaysShow',
    component: 'RadioButtonGroup',
    componentProps: {
      options: [
        { label: true, key: true, value: '显示' },
        { label: false, key: false, value: '隐藏' }
      ]
    },
    ifShow: ({ values }) => values.type !== 3
  },
  {
    label: '是否缓存',
    field: 'keepAlive',
    component: 'RadioButtonGroup',
    componentProps: {
      options: [
        { label: true, key: true, value: '缓存' },
        { label: false, key: false, value: '不缓存' }
      ]
    },
    ifShow: ({ values }) => values.type === 2
  }
]
