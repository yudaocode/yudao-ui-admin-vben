import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsReportApi } from '#/api/fms/report';
import type { FmsCashFlowStatementApi } from '#/api/fms/report/cash-flow-statement';

/** 现金流量表行：报表项目或现金流量辅助数据 */
export type FmsCashFlowStatementRow =
  | FmsCashFlowStatementApi.CashFlowAdjustment
  | FmsReportApi.ReportItem;

/** 列表字段 */
export function useGridColumns(
  adjustmentMode: boolean,
): VxeTableGridOptions<FmsCashFlowStatementRow>['columns'] {
  return [
    {
      field: 'name',
      title: '项目',
      minWidth: 480,
      slots: { default: 'name' },
    },
    {
      field: 'rowNo',
      title: '行次',
      width: 90,
      align: 'center',
      formatter: ({ cellValue }) => cellValue || '',
    },
    {
      field: 'yearAmount',
      title: adjustmentMode ? '本年数' : '本年累计金额',
      minWidth: 180,
      align: 'right',
      slots: { default: 'yearAmount' },
    },
    {
      field: 'currentAmount',
      title: adjustmentMode ? '本期数' : '本期金额',
      minWidth: 180,
      align: 'right',
      slots: { default: 'currentAmount' },
    },
  ];
}
