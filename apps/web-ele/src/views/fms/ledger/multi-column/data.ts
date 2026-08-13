import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsSubjectApi } from '#/api/fms/config/subject';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { FMS_DEBIT_CREDIT_DIRECTION } from '#/views/fms/utils/constants';
import { formatMoney } from '#/views/fms/utils/format';

/** 列表基础字段，动态科目列由 buildMultiColumnColumns 追加 */
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
      field: 'debitAmount',
      title: '借方',
      width: 125,
      align: 'right',
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
    {
      field: 'creditAmount',
      title: '贷方',
      width: 125,
      align: 'right',
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
    { field: 'balanceDirection', title: '方向', width: 70, align: 'center' },
    {
      field: 'balance',
      title: '余额',
      width: 130,
      align: 'right',
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
  ];
}

/** 构建多栏账列表字段，按余额方向追加借方/贷方专栏分组 */
export function buildMultiColumnColumns(
  columnSubjects: FmsLedgerApi.MultiColumnSubject[],
): VxeTableGridOptions<FmsLedgerApi.Detail>['columns'] {
  const buildChildColumns = (balanceDirection: number) =>
    columnSubjects
      .filter((column) => column.balanceDirection === balanceDirection)
      .map((column) => ({
        field: `columnAmounts.${column.subjectId}`,
        title: `${column.subjectCode}/${column.subjectName}`,
        minWidth: 145,
        align: 'right' as const,
        formatter: ({ cellValue }: { cellValue?: number }) =>
          formatMoney(cellValue),
      }));
  const debitChildren = buildChildColumns(FMS_DEBIT_CREDIT_DIRECTION.DEBIT);
  const creditChildren = buildChildColumns(FMS_DEBIT_CREDIT_DIRECTION.CREDIT);
  return [
    ...(useGridColumns() || []),
    ...(debitChildren.length > 0
      ? [{ title: '借方', align: 'center' as const, children: debitChildren }]
      : []),
    ...(creditChildren.length > 0
      ? [{ title: '贷方', align: 'center' as const, children: creditChildren }]
      : []),
  ];
}

/** 过滤出含下级科目的科目树 */
export function filterParentSubjects(
  items: FmsSubjectApi.Subject[],
): FmsSubjectApi.Subject[] {
  return items.flatMap((item) =>
    item.children?.length
      ? [{ ...item, children: filterParentSubjects(item.children) }]
      : [],
  );
}

/** 获得汇总行样式类名 */
export function getLedgerRowClassName({ row }: { row: FmsLedgerApi.Detail }) {
  return row.rowType === 2 ? '' : 'fms-ledger-summary-row';
}
