import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { formatMoney } from '#/views/fms/utils/format';

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<FmsLedgerApi.General>['columns'] {
  return [
    {
      field: 'subjectCode',
      title: '科目编码',
      width: 125,
      align: 'center',
      slots: { default: 'subjectCode' },
    },
    { field: 'subjectName', title: '科目名称', minWidth: 160 },
    { field: 'period', title: '期间', width: 100, align: 'center' },
    { field: 'digest', title: '摘要', minWidth: 130 },
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

/** 合并相同科目的编码和名称列 */
export function buildSpanMethod(getData: () => FmsLedgerApi.General[]) {
  return ({
    rowIndex,
    columnIndex,
  }: {
    columnIndex: number;
    rowIndex: number;
  }) => {
    if (columnIndex > 1) return { rowspan: 1, colspan: 1 };
    const data = getData();
    const subjectId = data[rowIndex]?.subjectId;
    if (rowIndex > 0 && data[rowIndex - 1]?.subjectId === subjectId) {
      return { rowspan: 0, colspan: 0 };
    }
    let rowspan = 1;
    while (data[rowIndex + rowspan]?.subjectId === subjectId) {
      rowspan++;
    }
    return { rowspan, colspan: 1 };
  };
}
