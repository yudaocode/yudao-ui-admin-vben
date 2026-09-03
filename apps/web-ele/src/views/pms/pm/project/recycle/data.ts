import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectApi } from '#/api/pms/pm/project';

/** 列表的搜索表单 */
// TODO @AI：命名对齐 system user，改成 useGridFormSchema。
export function useSearchFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '项目名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入项目名称',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PmsProjectApi.Project>['columns'] {
  return [
    {
      field: 'name',
      title: '项目名称',
      minWidth: 320,
    },
    {
      field: 'recycleTime',
      title: '删除时间',
      width: 220,
      formatter: 'formatDateTime',
    },
    {
      field: 'action',
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
