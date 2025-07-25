import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { z } from '#/adapter/form';
import {
  CommonStatusEnum,
  DICT_TYPE,
  getDictOptions,
  getRangePickerDefaultProps,
  SystemDataScopeEnum,
} from '#/utils';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '角色名称',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'code',
      label: '角色标识',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'sort',
      label: '显示顺序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        controlsPosition: 'right',
        placeholder: '请输入显示顺序',
      },
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '角色状态',
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
      label: '角色备注',
      component: 'Textarea',
    },
  ];
}

/** 分配数据权限的表单 */
export function useAssignDataPermissionFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '角色名称',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: '角色标识',
      componentProps: {
        disabled: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'dataScope',
      label: '权限范围',
      componentProps: {
        options: getDictOptions(DICT_TYPE.SYSTEM_DATA_SCOPE, 'number'),
      },
    },
    {
      fieldName: 'dataScopeDeptIds',
      label: '部门范围',
      component: 'Input',
      formItemClass: 'items-start',
      dependencies: {
        triggerFields: ['dataScope'],
        show: (values) => {
          return values.dataScope === SystemDataScopeEnum.DEPT_CUSTOM;
        },
      },
    },
  ];
}

/** 分配菜单的表单 */
export function useAssignMenuFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      fieldName: 'name',
      label: '角色名称',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'code',
      label: '角色标识',
      component: 'Input',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'menuIds',
      label: '菜单权限',
      component: 'Input',
      formItemClass: 'items-start',
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '角色名称',
      component: 'Input',
    },
    {
      fieldName: 'code',
      label: '角色标识',
      component: 'Input',
    },
    {
      fieldName: 'status',
      label: '角色状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
      },
    },
    {
      fieldName: 'createTime',
      label: '创建时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 40 },
    {
      field: 'id',
      title: '角色编号',
    },
    {
      field: 'name',
      title: '角色名称',
    },
    {
      field: 'type',
      title: '角色类型',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.SYSTEM_ROLE_TYPE },
      },
    },
    {
      field: 'code',
      title: '角色标识',
    },
    {
      field: 'sort',
      title: '显示顺序',
    },
    {
      field: 'remark',
      title: '角色备注',
    },
    {
      field: 'status',
      title: '角色状态',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'createTime',
      title: '创建时间',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
