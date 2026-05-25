import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProAndonConfigApi } from '#/api/mes/pro/andon/config';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import { getSimpleRoleList } from '#/api/system/role';
import { getSimpleUserList } from '#/api/system/user';

/** 安灯配置列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesProAndonConfigApi.AndonConfig>['columns'] {
  return [
    { field: 'reason', title: '呼叫原因', minWidth: 200 },
    {
      field: 'level',
      title: '级别',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_PRO_ANDON_LEVEL },
      },
    },
    { field: 'handlerRoleName', title: '处置角色', width: 140 },
    { field: 'handlerUserNickname', title: '处置人', width: 140 },
    { field: 'remark', title: '备注', minWidth: 160 },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 新增/修改安灯配置的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'reason',
      label: '呼叫原因',
      component: 'Textarea',
      componentProps: {
        autoSize: { maxRows: 3, minRows: 1 },
        maxLength: 200,
        placeholder: '请输入呼叫原因',
      },
      rules: z.string().min(1, '呼叫原因不能为空').max(200),
    },
    {
      fieldName: 'level',
      label: '级别',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MES_PRO_ANDON_LEVEL, 'number'),
        placeholder: '请选择级别',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'handlerRoleId',
      label: '处置角色',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleRoleList,
        labelField: 'name',
        placeholder: '请选择角色（与处置人至少填一个）',
        valueField: 'id',
      },
    },
    {
      fieldName: 'handlerUserId',
      label: '处置人',
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSimpleUserList,
        labelField: 'nickname',
        placeholder: '请选择处置人（与角色至少填一个）',
        valueField: 'id',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Input',
      componentProps: {
        maxLength: 100,
        placeholder: '请输入备注',
      },
    },
  ];
}
