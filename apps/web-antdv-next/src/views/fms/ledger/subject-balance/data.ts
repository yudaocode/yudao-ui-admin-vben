import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { formatMoney } from '#/views/fms/utils/format';

/** 科目余额表行（平铺树节点，携带父节点键供 VXE transform 树表使用） */
export type SubjectBalanceRow = Omit<FmsLedgerApi.SubjectBalance, 'children'> & {
  parentNodeKey?: string;
};

/** 平铺科目余额树，为每个节点补充父节点键 */
export function flattenSubjectBalanceTree(
  items: FmsLedgerApi.SubjectBalance[],
  parentNodeKey?: string,
): SubjectBalanceRow[] {
  return items.flatMap((item) => {
    const { children, ...row } = item;
    return [
      { ...row, parentNodeKey },
      ...flattenSubjectBalanceTree(children || [], item.nodeKey),
    ];
  });
}

/** 构建金额列 */
function buildMoneyColumn(field: string, title: string) {
  return {
    field,
    title,
    width: 125,
    align: 'right' as const,
    formatter: ({ cellValue }: { cellValue?: number }) =>
      formatMoney(cellValue),
  };
}

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<SubjectBalanceRow>['columns'] {
  return [
    {
      field: 'subjectCode',
      title: '科目编码',
      minWidth: 125,
      treeNode: true,
      slots: { default: 'subjectCode' },
    },
    { field: 'subjectName', title: '科目名称', minWidth: 150 },
    {
      title: '期初余额',
      align: 'center',
      children: [
        buildMoneyColumn('openingDebitAmount', '借方'),
        buildMoneyColumn('openingCreditAmount', '贷方'),
      ],
    },
    {
      title: '本期发生额',
      align: 'center',
      children: [
        buildMoneyColumn('periodDebitAmount', '借方'),
        buildMoneyColumn('periodCreditAmount', '贷方'),
      ],
    },
    {
      title: '本年累计发生额',
      align: 'center',
      children: [
        buildMoneyColumn('yearDebitAmount', '借方'),
        buildMoneyColumn('yearCreditAmount', '贷方'),
      ],
    },
    {
      title: '期末余额',
      align: 'center',
      children: [
        buildMoneyColumn('endingDebitAmount', '借方'),
        buildMoneyColumn('endingCreditAmount', '贷方'),
      ],
    },
  ];
}
