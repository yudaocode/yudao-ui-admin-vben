import { getDataSourceConfigList } from '@/api/infra/dataSourceConfig'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

const dataSourceConfigs = await getDataSourceConfigList()

export const columns: BasicColumn[] = [
  {
    title: '数据源',
    dataIndex: 'dataSourceConfigId',
    width: 100,
    customRender: ({ text }) => {
      for (const config of dataSourceConfigs) {
        if (text === config.id)
          return config.name
      }
      return `未知【${text}】`
    },
  },
  {
    title: '表名称',
    dataIndex: 'tableName',
    width: 200,
  },
  {
    title: '表描述',
    dataIndex: 'tableComment',
    width: 120,
  },
  {
    title: '实体',
    dataIndex: 'className',
    width: 200,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
  {
    title: '更新时间',
    dataIndex: 'updateTime',
    width: 180,
    customRender: ({ text }) => {
      return useRender.renderDate(text)
    },
  },
]

export const searchFormSchema: FormSchema[] = [
  {
    label: '表名称',
    field: 'tableName',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '表描述',
    field: 'tableComment',
    component: 'Input',
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
    label: '岗位名称',
    field: 'name',
    required: true,
    component: 'Input',
  },
  {
    label: '岗位编码',
    field: 'code',
    required: true,
    component: 'Input',
  },
  {
    label: '岗位顺序',
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

export const importTableColumns: BasicColumn[] = [
  {
    title: '表名称',
    dataIndex: 'name',
    width: 200,
  },
  {
    title: '表描述',
    dataIndex: 'comment',
    width: 120,
  },
]

export const importTableSearchFormSchema: FormSchema[] = [
  {
    label: '数据源',
    field: 'dataSourceConfigId',
    component: 'Select',
    required: true,
    defaultValue: dataSourceConfigs[0].id,
    componentProps: {
      options: dataSourceConfigs,
      fieldNames: {
        label: 'name',
        value: 'id',
      },
    },
    colProps: { span: 8 },
  },
  {
    label: '表名称',
    field: 'name',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '表描述',
    field: 'comment',
    component: 'Input',
    colProps: { span: 8 },
  },
]
