import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesCalTeamApi } from '#/api/mes/cal/team';

import { h } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { Button } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改班组的表单 */
export function useFormSchema(
  formType: FormType,
  formApi?: VbenFormApi,
): VbenFormSchema[] {
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
      fieldName: 'code',
      label: '班组编码',
      component: 'Input',
      componentProps: {
        maxLength: 64,
        placeholder: '请输入班组编码',
      },
      rules: z.string().min(1, '班组编码不能为空').max(64),
      suffix:
        formType === 'detail'
          ? undefined
          : () =>
              h(
                Button,
                {
                  type: 'default',
                  onClick: async () => {
                    const code = await generateAutoCode(MesAutoCodeRuleCode.CAL_TEAM_CODE);
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '班组名称',
      component: 'Input',
      componentProps: {
        maxLength: 100,
        placeholder: '请输入班组名称',
      },
      rules: z.string().min(1, '班组名称不能为空').max(100),
    },
    {
      fieldName: 'calendarType',
      label: '班组类型',
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: getDictOptions(DICT_TYPE.MES_CAL_CALENDAR_TYPE, 'number'),
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
        maxLength: 250,
        placeholder: '请输入备注',
        rows: 3,
      },
    },
  ];
}

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '班组编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入班组编码',
      },
    },
    {
      fieldName: 'name',
      label: '班组名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入班组名称',
      },
    },
    {
      fieldName: 'calendarType',
      label: '班组类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.MES_CAL_CALENDAR_TYPE, 'number'),
        placeholder: '请选择班组类型',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesCalTeamApi.Team>['columns'] {
  return [
    {
      field: 'code',
      title: '班组编码',
      minWidth: 150,
      slots: {
        default: 'code',
      },
    },
    { field: 'name', title: '班组名称', minWidth: 150 },
    {
      field: 'calendarType',
      title: '班组类型',
      width: 140,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_CAL_CALENDAR_TYPE },
      },
    },
    { field: 'remark', title: '备注', minWidth: 180 },
    { field: 'createTime', title: '创建时间', width: 180, formatter: 'formatDateTime' },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: {
        default: 'actions',
      },
    },
  ];
}

/** 班组选择弹窗搜索表单 */
export function useTeamSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '班组编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入班组编码',
      },
    },
    {
      fieldName: 'name',
      label: '班组名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入班组名称',
      },
    },
  ];
}

/** 班组选择弹窗字段 */
export function useTeamSelectGridColumns(): VxeTableGridOptions<MesCalTeamApi.Team>['columns'] {
  return [
    { type: 'checkbox', width: 50 },
    { field: 'code', title: '班组编码', minWidth: 140 },
    { field: 'name', title: '班组名称', minWidth: 140 },
    { field: 'remark', title: '备注', minWidth: 160 },
  ];
}
