import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformanceAssessmentTemplateApi } from '#/api/hrm/performance/config/assessment-template';

import { HrmPerformanceQuotaType } from '#/views/hrm/utils/constants';

/** 列表搜索 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '模板名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入模板名称',
        allowClear: true,
      },
    },
  ];
}

/** 列表列 */
export function useGridColumns(): VxeTableGridOptions<HrmPerformanceAssessmentTemplateApi.PerformanceAssessmentTemplate>['columns'] {
  return [
    { type: 'checkbox' as const, width: 50 },
    { field: 'name', title: '模板名称', minWidth: 180 },
    { field: 'illustrate', title: '描述', minWidth: 200 },
    {
      field: 'dimensionCount',
      title: '考核维度',
      width: 100,
      align: 'center',
    },
    {
      field: 'quotaCount',
      title: '考核指标',
      width: 100,
      align: 'center',
    },
    {
      field: 'upperLimitScore',
      title: '总分',
      width: 90,
      align: 'center',
    },
    { field: 'creatorName', title: '创建人', width: 120, align: 'center' },
    {
      field: 'updateTime',
      title: '最近更新时间',
      width: 180,
      align: 'center',
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 主表单 schema（基础字段，配置编辑器单独渲染） */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'name',
      label: '考核模板名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入考核模板名称',
        maxlength: 50,
        showCount: true,
        allowClear: true,
      },
    },
    {
      fieldName: 'illustrate',
      label: '考核指标说明',
      component: 'Textarea',
      componentProps: {
        placeholder: '请输入考核指标说明',
        maxlength: 200,
        showCount: true,
        rows: 3,
        allowClear: true,
      },
    },
  ];
}

/** 考核维度表单 */
export function useDimensionFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '维度名称',
      component: 'Input',
      rules: 'required',
      componentProps: { maxlength: 50, placeholder: '请输入维度名称' },
    },
    {
      fieldName: 'quotaType',
      label: '指标类型',
      component: 'Select',
      defaultValue: HrmPerformanceQuotaType.PERFORMANCE,
      rules: 'selectRequired',
      componentProps: {
        options: [
          { label: '业绩指标', value: HrmPerformanceQuotaType.PERFORMANCE },
          { label: '行为态度指标', value: HrmPerformanceQuotaType.BEHAVIOR },
        ],
        placeholder: '请选择指标类型',
      },
    },
    {
      fieldName: 'weight',
      label: '维度权重(%)',
      component: 'InputNumber',
      rules: 'required',
      componentProps: {
        class: 'w-full',
        max: 100,
        min: 0,
        precision: 2,
        placeholder: '请输入维度权重',
      },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: { maxlength: 200, rows: 2, placeholder: '请输入备注' },
    },
    {
      fieldName: 'allowEdit',
      component: 'Checkbox',
      defaultValue: false,
      renderComponentContent: () => ({ default: () => ['允许员工填写指标'] }),
    },
  ];
}

/** 考核指标内嵌编辑列 */
export function useQuotaGridColumns(): VxeTableGridOptions<HrmPerformanceAssessmentTemplateApi.AssessmentQuota>['columns'] {
  return [
    {
      field: 'name',
      title: '指标名称',
      minWidth: 160,
      slots: { default: 'name' },
    },
    {
      field: 'illustrate',
      title: '指标说明',
      minWidth: 200,
      slots: { default: 'illustrate' },
    },
    {
      field: 'standard',
      title: '考核标准',
      minWidth: 200,
      slots: { default: 'standard' },
    },
    {
      field: 'weight',
      title: '指标权重',
      minWidth: 130,
      slots: { default: 'weight' },
    },
    {
      field: 'scoreType',
      title: '评分方式',
      minWidth: 140,
      slots: { default: 'scoreType' },
    },
    {
      title: '操作',
      width: 80,
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}
