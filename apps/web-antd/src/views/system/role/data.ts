import {type VbenFormSchema, z} from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemRoleApi } from '#/api/system/role';

import { DICT_TYPE, getDictOptions } from '#/utils/dict';
import { CommonStatusEnum, SystemDataScopeEnum } from '#/utils/constants';

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
      component: 'Input',
      fieldName: 'name',
      label: '角色名称',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: '角色标识',
      rules:'required',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        class: 'w-full',
        controlsPosition: 'right',
        placeholder: '请输入角色顺序',
      },
      fieldName: 'sort',
      label: '角色顺序',
      rules: 'required',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        buttonStyle: 'solid',
        optionType: 'button',
      },
      fieldName: 'status',
      label: '角色状态',
      rules: z.number().default(CommonStatusEnum.ENABLE),
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: '角色备注',
    }
  ];
}

/** 分配数据权限的表单 */
export function useAssignDataPermissionFormSchema(): VbenFormSchema[] {
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
      component: 'Input',
      fieldName: 'name',
      label: '角色名称',
      componentProps: {
        disabled: true,
      }
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: '角色标识',
      componentProps: {
        disabled: true,
      }
    },
    {
      component: 'Select',
      fieldName: 'dataScope',
      label: '权限范围',
      componentProps: {
        class: 'w-full',
        options: getDictOptions(DICT_TYPE.SYSTEM_DATA_SCOPE, 'number'),
      }
    },
    {
      component: 'Input',
      fieldName: 'dataScopeDeptIds',
      label: '部门范围',
      // dependencies: {
      //   triggerFields: ['dataScope'],
      //   show: (values) => {
      //     return values.dataScope === SystemDataScopeEnum.DEPT_CUSTOM;
      //   }
      // },
      formItemClass: 'items-start', // TODO @芋艿：
      modelPropName: 'modelValue', // TODO @芋艿：
    }
  ]
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: '角色名称',
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: '角色标识',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
      fieldName: 'status',
      label: '角色状态',
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: '创建时间',
    },
  ];
}

/** 列表的字段 */
export function useGridColumns<T = SystemRoleApi.SystemRole>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'id',
      title: '角色编号',
      minWidth: 200,
    },
    {
      field: 'name',
      title: '角色名称',
      minWidth: 200,
    },
    {
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_ROLE_TYPE },
      },
      field: 'type',
      title: '角色类型',
      minWidth: 100,
    },
    {
      field: 'code',
      title: '角色标识',
      minWidth: 200,
    },
    {
      field: 'sort',
      title: '角色顺序',
      minWidth: 100,
    },
    {
      field: 'remark',
      minWidth: 100,
      title: '角色备注',
    },
    {
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
      field: 'status',
      title: '角色状态',
      minWidth: 100,
    },
    {
      field: 'createTime',
      title: '创建时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '角色',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          'edit', // 默认的编辑按钮
          'delete', // 默认的删除按钮
          {
            code: 'assign-data-permission',
            text: '数据权限',
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 220,
    },
  ];
}

// TODO @芋艿：角色分配
// TODO @芋艿：数据权限