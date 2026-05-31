import type { VbenFormApi, VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesCalPlanApi } from '#/api/mes/cal/plan';

import { h } from 'vue';

import { DICT_TYPE, MesAutoCodeRuleCode, MesCalPlanStatusEnum, MesCalShiftMethodEnum, MesCalShiftTypeEnum } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElButton } from 'element-plus';

import { generateAutoCode } from '#/api/mes/md/autocode/record';
import { getRangePickerDefaultProps } from '#/utils';

/** 表单类型 */
export type FormType = 'create' | 'detail' | 'update';

/** 新增/修改排班计划的表单 */
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
      defaultValue: MesCalPlanStatusEnum.PREPARE,
    },
    {
      fieldName: 'code',
      label: '计划编码',
      component: 'Input',
      componentProps: {
        placeholder: '请输入计划编码',
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
                    const code = await generateAutoCode(MesAutoCodeRuleCode.CAL_PLAN_CODE);
                    await formApi?.setFieldValue('code', code);
                  },
                },
                { default: () => '生成' },
              ),
    },
    {
      fieldName: 'name',
      label: '计划名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入计划名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'calendarType',
      label: '班组类型',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_CAL_CALENDAR_TYPE, 'number'),
        placeholder: '请选择班组类型',
      },
      rules: 'selectRequired',
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
      fieldName: 'shiftType',
      label: '轮班方式',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_CAL_SHIFT_TYPE, 'number'),
        placeholder: '请选择轮班方式',
      },
      rules: 'selectRequired',
    },
    {
      fieldName: 'shiftMethod',
      label: '倒班方式',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_CAL_SHIFT_METHOD, 'number'),
        placeholder: '请选择倒班方式',
      },
      dependencies: {
        triggerFields: ['shiftType'],
        show: (values) => !!values.shiftType && values.shiftType !== MesCalShiftTypeEnum.SINGLE,
      },
    },
    {
      fieldName: 'shiftCount',
      label: '倒班天数',
      component: 'InputNumber',
      componentProps: {
        class: '!w-full',
        controlsPosition: 'right',
        min: 1,
        precision: 0,
      },
      dependencies: {
        triggerFields: ['shiftMethod'],
        show: (values) => values.shiftMethod === MesCalShiftMethodEnum.DAY,
      },
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
      label: '计划编码',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入计划编码',
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
    {
      fieldName: 'startDate',
      label: '开始日期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
      },
    },
    {
      fieldName: 'endDate',
      label: '结束日期',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
      },
    },
    {
      fieldName: 'shiftType',
      label: '轮班方式',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_CAL_SHIFT_TYPE, 'number'),
        placeholder: '请选择轮班方式',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        clearable: true,
        options: getDictOptions(DICT_TYPE.MES_CAL_PLAN_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<MesCalPlanApi.Plan>['columns'] {
  return [
    {
      field: 'code',
      title: '计划编码',
      minWidth: 140,
      slots: {
        default: 'code',
      },
    },
    { field: 'name', title: '计划名称', minWidth: 150 },
    {
      field: 'calendarType',
      title: '班组类型',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_CAL_CALENDAR_TYPE },
      },
    },
    { field: 'startDate', title: '开始日期', width: 150, formatter: 'formatDate' },
    { field: 'endDate', title: '结束日期', width: 150, formatter: 'formatDate' },
    {
      field: 'shiftType',
      title: '轮班方式',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_CAL_SHIFT_TYPE },
      },
    },
    {
      field: 'shiftMethod',
      title: '倒班方式',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_CAL_SHIFT_METHOD },
      },
    },
    {
      field: 'status',
      title: '单据状态',
      width: 120,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.MES_CAL_PLAN_STATUS },
      },
    },
    { field: 'createTime', title: '创建时间', width: 180, formatter: 'formatDateTime' },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: {
        default: 'actions',
      },
    },
  ];
}
