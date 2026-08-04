import type { VxeGridProps } from '#/adapter/vxe-table';

import { formatHrmMoney } from '#/views/hrm/utils/format';

export function useGridColumns(): VxeGridProps['columns'] {
  return [
    { field: 'name', title: '方案名称', minWidth: 180 },
    { field: 'areaName', title: '参保城市', minWidth: 180 },
    {
      field: 'personalInsuranceAmount',
      title: '个人社保',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'corporateInsuranceAmount',
      title: '公司社保',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'personalProvidentFundAmount',
      title: '个人公积金',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'corporateProvidentFundAmount',
      title: '公司公积金',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    { field: 'useCount', title: '使用人数', width: 100, align: 'center' },
    {
      field: 'monthRecordCount',
      title: '历史月记录',
      width: 110,
      align: 'center',
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
