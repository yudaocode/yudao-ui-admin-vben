import { listSimpleDeptApi } from '@/api/system/dept'
import { listSimplePostsApi } from '@/api/system/post'
import { BasicColumn, FormSchema, useRender } from '@/components/Table'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

export const columns: BasicColumn[] = [
  {
    title: '用户编号',
    dataIndex: 'id',
    width: 100
  },
  {
    title: '用户名称',
    dataIndex: 'username',
    width: 180
  },
  {
    title: '用户昵称',
    dataIndex: 'nickname',
    width: 100
  },
  {
    title: '部门',
    dataIndex: 'dept.name',
    width: 120
  },
  {
    title: '手机号码',
    dataIndex: 'mobile',
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
    label: '用户名称',
    field: 'username',
    component: 'Input',
    colProps: { span: 8 }
  },
  {
    label: '手机号码',
    field: 'mobile',
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
  },
  {
    label: '创建时间',
    field: 'createTime',
    component: 'RangePicker',
    componentProps: {
      format: 'YYYY-MM-DD HH:mm:ss'
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
    label: '用户昵称',
    field: 'nickname',
    required: true,
    component: 'Input'
  },
  {
    label: '归属部门',
    field: 'deptId',
    required: true,
    component: 'ApiTreeSelect',
    componentProps: {
      api: () => listSimpleDeptApi(),
      fieldNames: {
        label: 'name',
        key: 'id',
        value: 'id'
      },
      handleTree: 'id'
    }
  },
  {
    label: '手机号码',
    field: 'mobile',
    required: true,
    component: 'InputNumber'
  },
  {
    label: '邮箱',
    field: 'email',
    required: true,
    component: 'Input'
  },
  {
    label: '用户名称',
    field: 'username',
    component: 'Input',
    dynamicDisabled: ({ values }) => values.id !== undefined
  },
  {
    label: '用户密码',
    field: 'password',
    component: 'InputPassword',
    ifShow: ({ values }) => values.id === undefined
  },
  {
    label: '用户性别',
    field: 'sex',
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX)
    }
  },
  {
    label: '岗位',
    field: 'postIds',
    component: 'ApiSelect',
    componentProps: {
      api: () => listSimplePostsApi(),
      labelField: 'name',
      valueField: 'id',
      mode: 'tags'
    }
  },
  {
    label: '状态',
    field: 'status',
    component: 'Select',
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
