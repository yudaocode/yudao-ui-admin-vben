import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { formatMoney } from '#/views/fms/utils/format';

/** 获得汇总行样式类名（期初、本期合计、本年累计等非明细行） */
export function getLedgerRowClassName({ row }: { row: FmsLedgerApi.Detail }) {
  return row.rowType === 2 ? '' : 'fms-ledger-summary-row';
}

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<FmsLedgerApi.Detail>['columns'] {
  return [
    { field: 'accountDate', title: '日期', width: 110, align: 'center' },
    {
      field: 'voucherNumber',
      title: '凭证字号',
      width: 110,
      align: 'center',
      slots: { default: 'voucherNumber' },
    },
    { field: 'digest', title: '摘要', minWidth: 180 },
    {
      field: 'debitAmount',
      title: '借方',
      width: 140,
      align: 'right',
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
    {
      field: 'creditAmount',
      title: '贷方',
      width: 140,
      align: 'right',
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
    { field: 'balanceDirection', title: '方向', width: 80, align: 'center' },
    {
      field: 'balance',
      title: '余额',
      width: 150,
      align: 'right',
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
  ];
}
