import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { formatMoney } from '#/views/fms/utils/format';

/** 平铺数量金额总账树，去掉下级节点引用 */
export function flattenBalanceTree(
  items: FmsLedgerApi.SubjectBalance[],
): FmsLedgerApi.SubjectBalance[] {
  return items.flatMap((item) => [
    { ...item, children: [] },
    ...flattenBalanceTree(item.children || []),
  ]);
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

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<FmsLedgerApi.SubjectBalance>['columns'] {
  return [
    {
      field: 'subjectCode',
      title: '科目编码',
      width: 125,
      align: 'center',
    },
    { field: 'subjectName', title: '科目名称', minWidth: 150 },
    { field: 'quantityUnit', title: '单位', width: 80, align: 'center' },
    {
      title: '期初余额',
      align: 'center',
      children: [
        {
          field: 'openingBalanceDirection',
          title: '方向',
          width: 70,
          align: 'center',
        },
        buildNumberColumn('openingQuantity', '数量', 105),
        buildNumberColumn('openingUnitPrice', '单价', 110),
        {
          field: 'openingAmount',
          title: '金额',
          width: 125,
          align: 'right',
          formatter: ({ row }) =>
            formatMoney(row.openingDebitAmount || row.openingCreditAmount),
        },
      ],
    },
    {
      title: '本期借方',
      align: 'center',
      children: [
        buildNumberColumn('periodDebitQuantity', '数量', 105),
        buildNumberColumn('periodDebitAmount', '金额', 125),
      ],
    },
    {
      title: '本期贷方',
      align: 'center',
      children: [
        buildNumberColumn('periodCreditQuantity', '数量', 105),
        buildNumberColumn('periodCreditAmount', '金额', 125),
      ],
    },
    {
      title: '本年累计借方',
      align: 'center',
      children: [
        buildNumberColumn('yearDebitQuantity', '数量', 105),
        buildNumberColumn('yearDebitAmount', '金额', 125),
      ],
    },
    {
      title: '本年累计贷方',
      align: 'center',
      children: [
        buildNumberColumn('yearCreditQuantity', '数量', 105),
        buildNumberColumn('yearCreditAmount', '金额', 125),
      ],
    },
    {
      title: '期末余额',
      align: 'center',
      children: [
        {
          field: 'endingBalanceDirection',
          title: '方向',
          width: 70,
          align: 'center',
        },
        buildNumberColumn('endingQuantity', '数量', 105),
        buildNumberColumn('endingUnitPrice', '单价', 110),
        {
          field: 'endingAmount',
          title: '金额',
          width: 125,
          align: 'right',
          formatter: ({ row }) =>
            formatMoney(row.endingDebitAmount || row.endingCreditAmount),
        },
      ],
    },
  ];
}
