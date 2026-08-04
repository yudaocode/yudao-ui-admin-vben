import type { VxeGridProps } from '#/adapter/vxe-table';

import { formatSalaryGroupScope } from '#/views/hrm/utils/format';

export function useGridColumns(): VxeGridProps['columns'] {
  return [
    { field: 'name', title: '薪资组名称', minWidth: 150 },
    {
      field: 'salaryStandard',
      title: '计薪标准',
      width: 120,
      formatter: ({ cellValue }) => `${cellValue ?? 0} 天/月`,
    },
    { field: 'taxRuleName', title: '计税规则', minWidth: 150 },
    { field: 'changeRule', title: '调薪规则', minWidth: 220 },
    {
      field: 'scope',
      title: '适用范围',
      minWidth: 180,
      formatter: ({ row }) => formatSalaryGroupScope(row),
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
