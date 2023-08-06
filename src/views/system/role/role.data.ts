import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { SystemDataScopeEnum } from '@/enums/systemEnum'

export const columns: BasicColumn[] = [
  {
    title: '角色编号',
    dataIndex: 'id',
    width: 120,
  },
  {
    title: '角色名称',
    dataIndex: 'name',
    width: 150,
  },
  {
    title: '角色标识',
    dataIndex: 'code',
    width: 150,
  },
  {
    title: '角色类型',
    dataIndex: 'type',
    width: 150,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.SYSTEM_ROLE_TYPE)
    },
  },
  {
    title: '显示顺序',
    dataIndex: 'sort',
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDict(text, DICT_TYPE.COMMON_STATUS)
    },
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '角色名称',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '角色标识',
    field: 'code',
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
  {
    label: '创建时间',
    field: 'createTime',
    component: 'RangePicker',
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
    label: '角色名称',
    field: 'name',
    required: true,
    component: 'Input',
  },
  {
    label: '角色标识',
    field: 'code',
    required: true,
    component: 'Input',
  },
  {
    label: '角色顺序',
    field: 'sort',
    required: true,
    defaultValue: 0,
    component: 'InputNumber',
  },
  {
    label: '状态',
    field: 'status',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.COMMON_STATUS),
    },
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
  },
]

export const menuScopeFormSchema: FormSchema[] = [
  {
    label: '角色编号',
    field: 'id',
    show: false,
    component: 'Input',
  },
  {
    label: '角色名称',
    field: 'name',
    dynamicDisabled: true,
    component: 'Input',
  },
  {
    label: '角色标识',
    field: 'code',
    dynamicDisabled: true,
    component: 'Input',
  },
  {
    label: '菜单权限',
    field: 'menuIds',
    component: 'Input',
    slot: 'menuIds',
  },
]

export const dataScopeFormSchema: FormSchema[] = [
  {
    label: '角色编号',
    field: 'roleId',
    show: false,
    component: 'Input',
  },
  {
    label: '角色名称',
    field: 'name',
    dynamicDisabled: true,
    component: 'Input',
  },
  {
    label: '角色标识',
    field: 'code',
    dynamicDisabled: true,
    component: 'Input',
  },
  {
    label: '权限范围',
    field: 'dataScope',
    required: true,
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_DATA_SCOPE),
    },
  },
  {
    label: '数据权限',
    field: 'dataScopeDeptIds',
    ifShow: ({ values }) => values.dataScope === SystemDataScopeEnum.DEPT_CUSTOM,
    component: 'Input',
    slot: 'dataScopeDeptIds',
  },
]
