import type { VxeGridProps } from '#/adapter/vxe-table';

export function useGridColumns(): VxeGridProps['columns'] {
  return [
    { field: 'name', title: '模板名称', minWidth: 180 },
    {
      field: 'defaultStatus',
      title: '默认模板',
      width: 100,
      slots: { default: 'defaultStatus' },
    },
    {
      field: 'options',
      title: '调薪项',
      minWidth: 260,
      slots: { default: 'options' },
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
