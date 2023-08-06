import { listSimpleDictType } from '@/api/system/dict/type'
import { listSimpleMenus } from '@/api/system/menu'
import type { FormSchema } from '@/components/Form'
import type { BasicColumn } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'

async function getDictTypeOptions() {
  const dictTypeOptions: any[] = []
  const res = await listSimpleDictType()
  dictTypeOptions.push(...res)
  return dictTypeOptions
}

export const basicInfoSchemas: FormSchema[] = [
  {
    label: '基本信息',
    field: 'basicInfo',
    component: 'Divider',
    colProps: { span: 24 },
  },
  {
    label: '表名称',
    field: 'tableName',
    required: true,
    component: 'Input',
    colProps: { span: 12 },
  },
  {
    label: '表描述',
    field: 'tableComment',
    required: true,
    component: 'Input',
    colProps: { span: 12 },
  },
  {
    label: '实体类名称',
    field: 'className',
    required: true,
    helpMessage: '默认去除表名的前缀。如果存在重复，则需要手动添加前缀，避免 MyBatis 报 Alias 重复的问题。',
    component: 'Input',
    colProps: { span: 12 },
  },
  {
    label: '作者',
    field: 'author',
    required: true,
    component: 'Input',
    colProps: { span: 12 },
  },
  {
    label: '生成信息',
    field: 'genInfo',
    component: 'Divider',
    colProps: { span: 24 },
  },
  {
    label: '生成模板',
    field: 'templateType',
    required: true,
    component: 'Select',
    defaultValue: '30',
    componentProps: {
      options: getDictOptions(DICT_TYPE.INFRA_CODEGEN_TEMPLATE_TYPE),
    },
    colProps: { span: 12 },
  },
  {
    label: '前端类型',
    field: 'frontType',
    required: true,
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.INFRA_CODEGEN_FRONT_TYPE),
    },
    colProps: { span: 12 },
  },
  {
    label: '生成场景',
    field: 'scene',
    required: true,
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.INFRA_CODEGEN_SCENE),
    },
    colProps: { span: 12 },
  },
  {
    label: '模块名',
    field: 'moduleName',
    required: true,
    helpMessage: '模块名，即一级目录，例如 system、infra、tool 等等',
    component: 'Input',
    colProps: { span: 12 },
  },
  {
    label: '业务名',
    field: 'businessName',
    required: true,
    component: 'Input',
    helpMessage: '业务名，即二级目录，例如 user、permission、dict 等等',
    colProps: { span: 12 },
  },
  {
    label: '类名称',
    field: 'className',
    required: true,
    component: 'Input',
    helpMessage: '类名称（首字母大写），例如SysUser、SysMenu、SysDictData 等等',
    colProps: { span: 12 },
  },
  {
    label: '类描述',
    field: 'classComment',
    required: true,
    component: 'Input',
    helpMessage: '用作类描述，例如 用户',
    colProps: { span: 12 },
  },
  {
    label: '上级菜单',
    field: 'parentMenuId',
    required: true,
    component: 'ApiTreeSelect',
    componentProps: {
      api: () => listSimpleMenus(),
      fieldNames: {
        label: 'name',
        key: 'id',
        value: 'id',
      },
      handleTree: 'id',
    },
    colProps: { span: 12 },
  },
  {
    label: '自定义路径',
    field: 'genPath',
    component: 'Input',
    helpMessage: '填写磁盘绝对路径，若不填写，则生成到当前Web项目下',
    defaultValue: '/',
    ifShow: ({ values }) => values.genType === '1',
    colProps: { span: 12 },
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
    colProps: { span: 24 },
  },
]

export const columns: BasicColumn[] = [
  {
    title: '字段列名',
    dataIndex: 'columnName',
    width: 60,
  },
  {
    title: '基础属性',
    children: [
      {
        title: '物理类型',
        dataIndex: 'dataType',
        editComponent: 'Select',
        width: 50,
      },
      {
        title: '字段描述',
        dataIndex: 'columnComment',
        editRow: true,
        editComponent: 'Input',
        width: 50,
      },
      {
        title: 'Java类型',
        dataIndex: 'javaType',
        editRow: true,
        editComponent: 'Select',
        editComponentProps: {
          options: [
            {
              label: 'Long',
              value: 'Long',
            },
            {
              label: 'String',
              value: 'String',
            },
            {
              label: 'Integer',
              value: 'Integer',
            },
            {
              label: 'Double',
              value: 'Double',
            },
            {
              label: 'BigDecimal',
              value: 'BigDecimal',
            },
            {
              label: 'LocalDateTime',
              value: 'LocalDateTime',
            },
            {
              label: 'Boolean',
              value: 'Boolean',
            },
          ],
        },
        width: 50,
      },
      {
        title: 'java属性',
        dataIndex: 'javaField',
        editRow: true,
        editComponent: 'Input',
        width: 50,
      },
    ],
  },
  {
    title: '增删改查',
    children: [
      {
        title: '插入',
        dataIndex: 'createOperation',
        editRow: true,
        editComponent: 'Checkbox',
        editValueMap: (value) => {
          return value ? '是' : '否'
        },
        width: 40,
      },
      {
        title: '编辑',
        dataIndex: 'updateOperation',
        editRow: true,
        editComponent: 'Checkbox',
        editValueMap: (value) => {
          return value ? '是' : '否'
        },
        width: 40,
      },
      {
        title: '列表',
        dataIndex: 'listOperationResult',
        editRow: true,
        editComponent: 'Checkbox',
        editValueMap: (value) => {
          return value ? '是' : '否'
        },
        width: 40,
      },
      {
        title: '查询',
        dataIndex: 'listOperation',
        editRow: true,
        editComponent: 'Checkbox',
        editValueMap: (value) => {
          return value ? '是' : '否'
        },
        width: 40,
      },
      {
        title: '查询方式',
        dataIndex: 'listOperationCondition',
        editRow: true,
        editComponent: 'Select',
        editComponentProps: {
          options: [
            { label: '=', value: '=' },
            { label: '!=', value: '!=' },
            { label: '>', value: '>' },
            { label: '>=', value: '>=' },
            { label: '<', value: '<' },
            { label: '<=', value: '<=' },
            { label: 'LIKE', value: 'LIKE' },
            { label: 'BETWEEN', value: 'BETWEEN' },
          ],
        },
        width: 80,
      },
      {
        title: '允许空',
        dataIndex: 'nullable',
        editRow: true,
        editComponent: 'Checkbox',
        editValueMap: (value) => {
          return value ? '是' : '否'
        },
        width: 40,
      },
      {
        title: '显示类型',
        dataIndex: 'htmlType',
        editRow: true,
        editComponent: 'Select',
        editComponentProps: {
          options: [
            { label: '文本框', value: 'input' },
            { label: '文本域', value: 'textarea' },
            { label: '下拉框', value: 'select' },
            { label: '单选框', value: 'radio' },
            { label: '复选框', value: 'checkbox' },
            { label: '日期控件', value: 'datetime' },
            { label: '图片上传', value: 'imageUpload' },
            { label: '文件上传', value: 'fileUpload' },
            { label: '富文本控件', value: 'editor' },
          ],
        },
        width: 60,
      },
      {
        title: '字典类型',
        dataIndex: 'dictType',
        editRow: true,
        editComponent: 'Select',
        editComponentProps: {
          options: (await getDictTypeOptions()).map(item => ({ value: item.type, label: item.name })),
        },
        width: 100,
      },
      {
        title: '示例',
        dataIndex: 'example',
        editRow: true,
        editComponent: 'Input',
        width: 60,
      },
    ],
  },
]
