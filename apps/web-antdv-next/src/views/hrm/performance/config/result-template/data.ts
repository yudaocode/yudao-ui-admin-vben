import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformanceResultTemplateApi } from '#/api/hrm/performance/config/result-template';

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
export function useGridColumns(): VxeTableGridOptions<HrmPerformanceResultTemplateApi.PerformanceResultTemplate>['columns'] {
  return [
    { type: 'checkbox' as const, width: 50 },
    { field: 'name', title: '结果模板名称', minWidth: 180 },
    {
      field: 'levels',
      title: '等级设置',
      minWidth: 200,
      formatter: ({ cellValue }) =>
        (cellValue as HrmPerformanceResultTemplateApi.ResultLevel[] | undefined)
          ?.map((level) => level.name)
          .filter(Boolean)
          .join('、') || '-',
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

/** 主表单 schema */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'name',
      label: '结果设置名称',
      component: 'Input',
      rules: 'required',
      componentProps: {
        placeholder: '请输入结果设置名称',
        maxlength: 255,
        allowClear: true,
      },
    },
  ];
}
