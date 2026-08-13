import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsSubjectApi } from '#/api/fms/config/subject';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { formatMoney } from '#/views/fms/utils/format';

/** 获得汇总行样式类名（期初、本期合计、本年累计等非明细行） */
export function getLedgerRowClassName({ row }: { row: FmsLedgerApi.Detail }) {
  return row.rowType === 2 ? '' : 'fms-ledger-summary-row';
}

/** 过滤出数量核算科目树 */
export function filterQuantitySubjects(
  subjects: FmsSubjectApi.Subject[],
): FmsSubjectApi.Subject[] {
  return subjects.flatMap((subject) => {
    const children = filterQuantitySubjects(subject.children || []);
    return subject.quantityAccounting ? [{ ...subject, children }] : children;
  });
}

/** 构建数值列 */
function buildNumberColumn(field: string, title: string, width: number) {
  return {
    field,
    title,
    width,
    align: 'right' as const,
    formatter: ({ cellValue }: { cellValue?: number }) =>
      formatMoney(cellValue),
  };
}

/** 构建单价列，按数量和金额实时计算 */
function buildUnitPriceColumn(
  title: string,
  getUnitPrice: (row: FmsLedgerApi.Detail) => number | undefined,
) {
  return {
    title,
    width: 110,
    align: 'right' as const,
    formatter: ({ row }: { row: FmsLedgerApi.Detail }) =>
      formatMoney(getUnitPrice(row)),
  };
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
    { field: 'digest', title: '摘要', minWidth: 160 },
    {
      title: '借方发生额',
      align: 'center',
      children: [
        buildNumberColumn('debitQuantity', '数量', 105),
        buildUnitPriceColumn('单价', (row) =>
          row.debitQuantity ? row.debitAmount / row.debitQuantity : undefined,
        ),
        buildNumberColumn('debitAmount', '金额', 125),
      ],
    },
    {
      title: '贷方发生额',
      align: 'center',
      children: [
        buildNumberColumn('creditQuantity', '数量', 105),
        buildUnitPriceColumn('单价', (row) =>
          row.creditQuantity
            ? row.creditAmount / row.creditQuantity
            : undefined,
        ),
        buildNumberColumn('creditAmount', '金额', 125),
      ],
    },
    {
      title: '余额',
      align: 'center',
      children: [
        {
          field: 'balanceDirection',
          title: '方向',
          width: 70,
          align: 'center',
        },
        buildNumberColumn('balanceQuantity', '数量', 105),
        buildUnitPriceColumn('单价', (row) =>
          row.balanceQuantity ? row.balance / row.balanceQuantity : undefined,
        ),
        buildNumberColumn('balance', '金额', 125),
      ],
    },
  ];
}
