import { h } from 'vue'
import { Switch } from 'ant-design-vue'
import { useMessage } from '@/hooks/web/useMessage'
import { listSimpleDept } from '@/api/system/dept'
import { listSimplePosts } from '@/api/system/post'
import type { BasicColumn, FormSchema } from '@/components/Table'
import { useRender } from '@/components/Table'
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import { updateUserStatus } from '@/api/system/user'
import { listSimpleRoles } from '@/api/system/role'

export const columns: BasicColumn[] = [
  {
    title: '用户编号',
    dataIndex: 'id',
    width: 100,
  },
  {
    title: '用户名称',
    dataIndex: 'username',
    width: 180,
  },
  {
    title: '用户昵称',
    dataIndex: 'nickname',
    width: 100,
  },
  {
    title: '部门',
    dataIndex: 'deptId',
    width: 120,
    customRender: ({ record }) => {
      return useRender.renderTag(record.dept && record.dept.name)
    },
  },
  {
    title: '手机号码',
    dataIndex: 'mobile',
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'status',
    width: 180,
    // customRender: ({ text }) => {
    //   return useRender.renderDict(text, DICT_TYPE.COMMON_STATUS)
    // }
    customRender: ({ record }) => {
      if (!Reflect.has(record, 'pendingStatus'))
        record.pendingStatus = false

      return h(Switch, {
        checked: record.status === 0,
        checkedChildren: '已启用',
        unCheckedChildren: '已禁用',
        loading: record.pendingStatus,
        onChange(checked: boolean) {
          record.pendingStatus = true
          const newStatus = checked ? 0 : 1
          const { createMessage } = useMessage()
          updateUserStatus(record.id, newStatus)
            .then(() => {
              record.status = newStatus
              createMessage.success('已成功修改用户状态')
            })
            .catch(() => {
              createMessage.error('修改用户状态失败')
            })
            .finally(() => {
              record.pendingStatus = false
            })
        },
      })
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
    label: '用户名称',
    field: 'username',
    component: 'Input',
    colProps: { span: 8 },
  },
  {
    label: '手机号码',
    field: 'mobile',
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
    componentProps: {
      format: 'YYYY-MM-DD HH:mm:ss',
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
    label: '用户昵称',
    field: 'nickname',
    required: true,
    component: 'Input',
  },
  {
    label: '用户头像',
    field: 'avatar',
    component: 'FileUpload',
    componentProps: {
      maxCount: 1,
      fileType: 'image',
    },
  },
  {
    label: '归属部门',
    field: 'deptId',
    required: true,
    component: 'ApiTreeSelect',
    componentProps: {
      api: () => listSimpleDept(),
      fieldNames: {
        label: 'name',
        key: 'id',
        value: 'id',
      },
      handleTree: 'id',
    },
  },
  {
    label: '手机号码',
    field: 'mobile',
    required: true,
    defaultValue: 0,
    component: 'InputNumber',
  },
  {
    label: '邮箱',
    field: 'email',
    required: true,
    component: 'Input',
  },
  {
    label: '用户名称',
    field: 'username',
    component: 'Input',
    dynamicDisabled: ({ values }) => !!values.id,
  },
  {
    label: '用户密码',
    field: 'password',
    component: 'InputPassword',
    ifShow: ({ values }) => !values.id,
  },
  {
    label: '用户性别',
    field: 'sex',
    component: 'Select',
    componentProps: {
      options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX),
    },
  },
  {
    label: '岗位',
    field: 'postIds',
    component: 'ApiSelect',
    defaultValue: [],
    componentProps: {
      api: () => listSimplePosts(),
      labelField: 'name',
      valueField: 'id',
      mode: 'tags',
    },
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

export const userRoleFormSchema: FormSchema[] = [
  {
    label: '编号',
    field: 'id',
    show: false,
    component: 'Input',
  },
  {
    label: '用户名称',
    field: 'username',
    component: 'Input',
    dynamicDisabled: () => true,
  },
  {
    label: '用户昵称',
    field: 'nickname',
    component: 'Input',
    dynamicDisabled: () => true,
  },
  {
    label: '角色',
    field: 'roleIds',
    component: 'ApiSelect',
    componentProps: {
      api: () => listSimpleRoles(),
      labelField: 'name',
      valueField: 'id',
      mode: 'tags',
    },
  },
]

export const userPwdFormSchema: FormSchema[] = [
  {
    field: 'newPassword',
    label: '新密码',
    component: 'StrengthMeter',
    componentProps: {
      placeholder: '新密码',
    },
    rules: [
      {
        required: true,
        message: '请输入新密码',
      },
    ],
  },
  {
    field: 'confirmPassword',
    label: '确认密码',
    component: 'InputPassword',
    dynamicRules: ({ values }) => {
      return [
        {
          required: true,
          validator: (_, value) => {
            if (!value)
              return Promise.reject('密码不能为空')

            if (value !== values.newPassword)
              return Promise.reject('两次输入的密码不一致!')

            return Promise.resolve()
          },
        },
      ]
    },
  },
]
