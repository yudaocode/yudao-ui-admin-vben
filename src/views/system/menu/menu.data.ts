import { listSimpleMenus } from '@/api/system/menu'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { SystemMenuTypeEnum } from '@/enums/systemEnum'

export const columns: BasicColumn[] = [
  {
    title: '菜单名称',
    dataIndex: 'name',
    width: 250,
    align: 'left',
  },
  {
    title: '菜单类型',
    dataIndex: 'type',
    width: 80,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_MENU_TYPE)
    },
  },
  {
    title: '图标',
    dataIndex: 'icon',
    width: 60,
    customRender: ({ record }) => {
      return useRender.renderIcon(record.icon)
    },
  },
  {
    title: '排序',
    dataIndex: 'sort',
    width: 60,
  },
  {
    title: '权限标识',
    dataIndex: 'permission',
    width: 140,
  },
  {
    title: '组件路径',
    dataIndex: 'component',
    width: 140,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 80,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.COMMON_STATUS)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '菜单名称',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS),
    },
    colProps: { span: 8 },
  },
]

export const formSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input',
  },
  {
    label: '上级菜单',
    field: 'parentId',
    required: true,
    component: 'ApiTreeSelect',
    componentProps: {
      api: () => listSimpleMenus(),
      parentLabel: '主类目',
      fieldNames: {
        label: 'name',
        key: 'id',
        value: 'id',
      },
      handleTree: 'id',
    },
  },
  {
    label: '菜单类型',
    field: 'type',
    required: true,
    defaultValue: '0',
    component: 'RadioButtonGroup',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_MENU_TYPE),
    },
    colProps: { lg: 24, md: 24 },
  },
  {
    label: '菜单名称',
    field: 'name',
    required: true,
    component: 'Input',
  },
  {
    label: '菜单图标',
    field: 'icon',
    component: 'IconPicker',
    ifShow: ({ values }) => values.type !== SystemMenuTypeEnum.BUTTON,
  },
  {
    label: '显示排序',
    field: 'sort',
    required: true,
    component: 'InputNumber',
    defaultValue: 0,
  },
  {
    label: '路由地址',
    field: 'path',
    required: true,
    component: 'Input',
    helpMessage: '访问的路由地址，如：`user`。如需外网地址时，则以 `http(s)://` 开头',
    ifShow: ({ values }) => values.type !== SystemMenuTypeEnum.BUTTON,
  },
  {
    label: '权限标识',
    field: 'permission',
    component: 'Input',
    helpMessage: 'Controller 方法上的权限字符，如：@PreAuthorize(`@ss.hasPermission("system:user:list")`)',
    ifShow: ({ values }) => values.type !== SystemMenuTypeEnum.DIR,
  },
  {
    label: '组件路径',
    field: 'component',
    component: 'Input',
    helpMessage: '例如：system/user/index',
    ifShow: ({ values }) => values.type === SystemMenuTypeEnum.MENU,
  },
  {
    label: '组件名称',
    field: 'componentName',
    component: 'Input',
    helpMessage: '例如：SystemUser',
    ifShow: ({ values }) => values.type === SystemMenuTypeEnum.MENU,
  },
  {
    label: '菜单状态',
    field: 'status',
    required: true,
    component: 'RadioButtonGroup',
    helpMessage: '选择停用时，路由将不会出现在侧边栏，也不能被访问',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS),
    },
  },
  {
    label: '显示状态',
    field: 'visible',
    component: 'Switch',
    componentProps: {
      checkedChildren: '显示',
      unCheckedChildren: '隐藏',
    },
    helpMessage: '选择隐藏时，路由将不会出现在侧边栏，但仍然可以访问',
    ifShow: ({ values }) => values.type !== SystemMenuTypeEnum.BUTTON,
  },
  {
    label: '总是显示',
    field: 'alwaysShow',
    component: 'Switch',
    componentProps: {
      checkedChildren: '显示',
      unCheckedChildren: '隐藏',
    },
    helpMessage: '选择不是时，当该菜单只有一个子菜单时，不展示自己，直接展示子菜单',
    ifShow: ({ values }) => values.type !== SystemMenuTypeEnum.BUTTON,
  },
  {
    label: '是否缓存',
    field: 'keepAlive',
    component: 'Switch',
    componentProps: {
      checkedChildren: '缓存',
      unCheckedChildren: '不缓存',
    },
    helpMessage: '选择缓存时，则会被 `keep-alive` 缓存，必须填写「组件名称」字段',
    ifShow: ({ values }) => values.type === SystemMenuTypeEnum.MENU,
  },
]
