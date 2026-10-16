import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectApi } from '#/api/pms/pm/project';

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PmsProjectApi.Project>['columns'] {
  return [
    {
      field: 'name',
      title: '项目名称',
      minWidth: 320,
    },
    {
      field: 'archiveTime',
      title: '归档时间',
      width: 220,
      formatter: 'formatDateTime',
    },
    {
      field: 'action',
      title: '操作',
      width: 120,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ];
}
