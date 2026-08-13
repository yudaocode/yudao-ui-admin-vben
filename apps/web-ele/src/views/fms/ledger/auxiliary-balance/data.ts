import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { formatMoney } from '#/views/fms/utils/format';

/** 构建金额列 */
function buildMoneyColumn(field: string, title: string) {
  return {
    field,
    title,
    minWidth: 130,
    align: 'right' as const,
    formatter: ({ cellValue }: { cellValue?: number }) =>
      formatMoney(cellValue),
  };
}

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<FmsLedgerApi.AuxiliaryBalance>['columns'] {
  return [
    { field: 'code', title: '编码', minWidth: 120, align: 'center' },
    { field: 'name', title: '项目名称', minWidth: 180 },
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
