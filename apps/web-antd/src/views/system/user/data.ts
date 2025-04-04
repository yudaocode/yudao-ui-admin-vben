import type {  VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { z } from '#/adapter/form';
import { DICT_TYPE, getDictOptions } from '#/utils/dict';
import { CommonStatusEnum } from '#/utils/constants';
import { getDeptList } from '#/api/system/dept';
import { getSimplePostList } from '#/api/system/post';
import { getSimpleRoleList } from '#/api/system/role';
import { handleTree } from '#/utils/tree';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      label: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'username',
      label: '用户名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户名称',
      },
      rules: 'required',
    },
    {
      label: '用户密码',
      fieldName: 'password',
      component: 'InputPassword',
      componentProps: {
        placeholder: '请输入用户密码',
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['id'],
        show: (values) => !values.id,
      },
    },
    {
      fieldName: 'nickname',
      label: '用户昵称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户昵称',
      },
      rules: 'required',
    },
    {
      fieldName: 'deptId',
      label: '归属部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => {
          const data = await getDeptList();
          return handleTree(data);
        },
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        placeholder: '请选择归属部门',
        treeDefaultExpandAll: true,
      },
    },
    {
      fieldName: 'postIds',
      label: '岗位',
      component: 'ApiSelect',
      componentProps: {
        api: getSimplePostList,
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
        mode: 'multiple',
        placeholder: '请选择岗位',
      },
    },
    {
      fieldName: 'email',
      label: '邮箱',
      component: 'Input',
      componentProps: {
        placeholder: '请输入邮箱',
      },
      rules: z.string().email('邮箱格式不正确').optional(),
    },
    {
      fieldName: 'mobile',
      label: '手机号码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机号码',
      }
    },
    {
      fieldName: 'sex',
      label: '用户性别',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_USER_SEX, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'status',
      label: '用户状态',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入备注',
      }
    },
  ];
}

/** 重置密码的表单 */
export function useResetPasswordFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      label: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'newPassword',
      label: '新密码',
      component: 'InputPassword',
      componentProps: {
        placeholder: '请输入新密码',
      },
      rules: 'required',
    },
    {
      fieldName: 'confirmPassword',
      label: '确认密码',
      component: 'InputPassword',
      componentProps: {
        placeholder: '请再次输入新密码',
      },
      dependencies: {
        rules(values: Record<string, any>) {
          const { newPassword } = values;
          return z
            .string()
            .nonempty('确认密码不能为空')
            .refine((value) => value === newPassword, '两次输入的密码不一致');
        },
        triggerFields: ['newPassword'],
      },
    },
  ]
}

/** 分配角色的表单 */
export function useAssignRoleFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      label: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'username',
      label: '用户名称',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'nickname',
      label: '用户昵称',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'roleIds',
      label: '角色',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleRoleList,
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
        mode: 'multiple',
        placeholder: '请选择角色',
      },
    },
  ]
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'username',
      label: '用户名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入用户名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'mobile',
      label: '手机号码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入手机号码',
        allowClear: true,
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        allowClear: true,
        showTime: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: ['开始日期', '结束日期'],
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = SystemUserApi.SystemUser>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (newStatus: number, row: T) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '用户编号',
      minWidth: 100,
    },
    {
      field: 'username',
      title: '用户名称',
      minWidth: 120,
    },
    {
      field: 'nickname',
      title: '用户昵称',
      minWidth: 120,
    },
    {
      field: 'deptName',
      title: '部门',
      minWidth: 120,
    },
    {
      field: 'mobile',
      title: '手机号码',
      minWidth: 120,
    },
    {
      field: 'status',
      title: '状态',
      minWidth: 100,
      align: 'center',
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: 'CellSwitch',
        props: {
          checkedValue: CommonStatusEnum.ENABLE,
          unCheckedValue: CommonStatusEnum.DISABLE,
        },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'operation',
      title: '操作',
      minWidth: 160,
      fixed: 'right',
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'username',
          nameTitle: '用户',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        // TODO @芋艿：后续把 delete、assign-role、reset-password 搞成“更多”
        options: [
          'edit', // 默认的编辑按钮
          'delete', // 默认的删除按钮
          {
            code: 'assign-role',
            text: '分配角色',
          },
          {
            code: 'reset-password',
            text: '重置密码',
          },
        ],
      },
    },
  ];
}
