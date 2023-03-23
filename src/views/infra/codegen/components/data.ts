import { listSimpleMenus } from '@/api/system/menu'
import { FormSchema } from '@/components/Form'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'

export const basicInfoSchemas: FormSchema[] = [
  {
    label: '基本信息',
    field: 'basicInfo',
    component: 'Divider',
    colProps: { span: 24 }
  },
  {
    label: '表名称',
    field: 'tableName',
    required: true,
    component: 'Input',
    colProps: { span: 12 }
  },
  {
    label: '表描述',
    field: 'tableComment',
    required: true,
    component: 'Input',
    colProps: { span: 12 }
  },
  {
    label: '实体类名称',
    field: 'className',
    required: true,
    helpMessage: '默认去除表名的前缀。如果存在重复，则需要手动添加前缀，避免 MyBatis 报 Alias 重复的问题。',
    component: 'Input',
    colProps: { span: 12 }
  },
  {
    label: '作者',
    field: 'author',
    required: true,
    component: 'Input',
    colProps: { span: 12 }
  },
  {
    label: '生成信息',
    field: 'genInfo',
    component: 'Divider',
    colProps: { span: 24 }
  },
  {
    label: '生成模板',
    field: 'templateType',
    required: true,
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.INFRA_CODEGEN_TEMPLATE_TYPE)
    },
    colProps: { span: 12 }
  },
  {
    label: '生成场景',
    field: 'scene',
    required: true,
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.INFRA_CODEGEN_SCENE)
    },
    colProps: { span: 12 }
  },
  {
    label: '模块名',
    field: 'moduleName',
    required: true,
    helpMessage: '模块名，即一级目录，例如 system、infra、tool 等等',
    component: 'Input',
    colProps: { span: 12 }
  },
  {
    label: '业务名',
    field: 'businessName',
    required: true,
    component: 'Input',
    helpMessage: '业务名，即二级目录，例如 user、permission、dict 等等',
    colProps: { span: 12 }
  },
  {
    label: '类名称',
    field: 'className',
    required: true,
    component: 'Input',
    helpMessage: '类名称（首字母大写），例如SysUser、SysMenu、SysDictData 等等',
    colProps: { span: 12 }
  },
  {
    label: '类描述',
    field: 'classComment',
    required: true,
    component: 'Input',
    helpMessage: '用作类描述，例如 用户',
    colProps: { span: 12 }
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
        value: 'id'
      },
      handleTree: 'id'
    },
    colProps: { span: 12 }
  },
  {
    label: '自定义路径',
    field: 'genPath',
    component: 'Input',
    helpMessage: '填写磁盘绝对路径，若不填写，则生成到当前Web项目下',
    defaultValue: '/',
    ifShow: ({ values }) => values.genType === '1',
    colProps: { span: 12 }
  },
  {
    label: '备注',
    field: 'remark',
    component: 'InputTextArea',
    colProps: { span: 24 }
  }
]
