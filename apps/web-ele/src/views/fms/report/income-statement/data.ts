import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsReportApi } from '#/api/fms/report';

import { formatMoney } from '#/views/fms/utils/format';

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<FmsReportApi.ReportItem>['columns'] {
  return [
    {
      field: 'name',
      title: '项目',
      minWidth: 420,
      slots: { default: 'name' },
    },
    { field: 'rowNo', title: '行次', width: 90, align: 'center' },
    {
      field: 'yearAmount',
      title: '本年累计金额',
      minWidth: 180,
      align: 'right',
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
    {
      field: 'currentAmount',
      title: '本期金额',
      minWidth: 180,
      align: 'right',
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
  ];
}
