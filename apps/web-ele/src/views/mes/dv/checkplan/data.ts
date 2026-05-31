import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvCheckPlanApi } from '#/api/mes/dv/checkplan';

import { h } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesDvCheckPlanStatusEnum, MesDvSubjectTypeEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton } from 'element-plus';

import { z } from '#/adapter/form';
import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getRangePickerDefaultProps } from '#/utils';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改点检保养方案的表单 */
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
      fieldName: 'status',
      component: 'Input',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
      defaultValue: MesDvCheckPlanStatusEnum.PREPARE,
    },
    {
      fieldName: 'code',
      label: '方案编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入方案编码',
      },
      rules: 'required',
      suffix:
        formType === 'detail'
          ? undefined
          : () =>
              h(
                ElButton,
                {
                  onClick: async () => {
                    const code = await generateAutoCode(MesAutoCodeRuleCode.DV_CHECK_PLAN_CODE);
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '方案名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入方案名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'type',
      label: '方案类型',
      component: 'RadioGroup',
      componentProps: {
        options: getDictOptions(DICT_TYPE.MES_DV_SUBJECT_TYPE, 'number'),
      },
      rules: z.number().default(MesDvSubjectTypeEnum.CHECK),
    },
    {
      fieldName: 'startDate',
      label: '开始日期',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        format: 'YYYY-MM-DD',
        placeholder: '请选择开始日期',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'endDate',
      label: '结束日期',
      component: 'DatePicker',
      componentProps: {
        class: '!w-full',
        format: 'YYYY-MM-DD',
        placeholder: '请选择结束日期',
        valueFormat: 'x',
      },
      rules: 'required',
    },
    {
      fieldName: 'cycleType',
      label: '周期类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_DV_CYCLE_TYPE, 'number'),
        placeholder: '请选择周期类型',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'cycleCount',
      label: '周期数量',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 1,
        precision: 0,
      },
      rules: z.number().default(1),
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      formItemClass: 'col-span-3',
      componentProps: {
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
      label: '方案编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入方案编码',
      },
    },
    {
      fieldName: 'name',
      label: '方案名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入方案名称',
      },
    },
    {
      fieldName: 'type',
      label: '方案类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_DV_SUBJECT_TYPE, 'number'),
        placeholder: '请选择方案类型',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_DV_CHECK_PLAN_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
    {
      fieldName: 'startDate',
      label: '开始日期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesDvCheckPlanApi.CheckPlan>['columns'] {
  return [
    {
      field: 'code',
      title: '方案编码',
      minWidth: 140,
      slots: {
        default: 'code',
      },
    },
    { field: 'name', title: '方案名称', minWidth: 150 },
    {
      field: 'type',
      title: '方案类型',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_DV_SUBJECT_TYPE },
      },
    },
    { field: 'startDate', title: '开始日期', width: 150, formatter: 'formatDate' },
    { field: 'endDate', title: '结束日期', width: 150, formatter: 'formatDate' },
    {
      field: 'cycleType',
      title: '周期类型',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_DV_CYCLE_TYPE },
      },
    },
    { field: 'cycleCount', title: '周期数量', width: 100 },
    {
      field: 'status',
      title: '状态',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_DV_CHECK_PLAN_STATUS },
      },
    },
    { field: 'createTime', title: '创建时间', width: 180, formatter: 'formatDateTime' },
    {
      title: '操作',
      width: 240,
      fixed: 'right',
      slots: {
        default: 'actions',
      },
    },
  ];
}

/** 点检方案选择弹窗的搜索表单 */
export function useCheckPlanSelectGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'code',
      label: '计划编号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入计划编号',
      },
    },
    {
      fieldName: 'name',
      label: '计划名称',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入计划名称',
      },
    },
  ];
}

/** 点检方案选择弹窗的字段 */
export function useCheckPlanSelectGridColumns(
  multiple = false,
): VxeTableGridOptions<MesDvCheckPlanApi.CheckPlan>['columns'] {
  return [
    { type: multiple ? 'checkbox' : 'radio', width: 50 },
    { field: 'code', title: '计划编码', minWidth: 180 },
    { field: 'name', title: '计划名称', minWidth: 150 },
    {
      field: 'type',
      title: '计划类型',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_DV_SUBJECT_TYPE },
      },
    },
    { field: 'startDate', title: '开始日期', width: 120, formatter: 'formatDate' },
    { field: 'endDate', title: '结束日期', width: 120, formatter: 'formatDate' },
    { field: 'cycleCount', title: '频率', width: 100 },
    {
      field: 'cycleType',
      title: '周期类型',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_DV_CYCLE_TYPE },
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_DV_CHECK_PLAN_STATUS },
      },
    },
  ];
}
