import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformanceAssessmentTemplateApi } from '#/api/hrm/performance/config/assessment-template';

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
