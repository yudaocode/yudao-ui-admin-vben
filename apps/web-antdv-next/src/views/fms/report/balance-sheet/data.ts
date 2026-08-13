import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsBalanceSheetApi } from '#/api/fms/report/balance-sheet';

import { formatMoney } from '#/views/fms/utils/format';

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<FmsBalanceSheetApi.BalanceSheetRow>['columns'] {
  return [
    {
      field: 'assetName',
      title: '资产',
      minWidth: 210,
      slots: { default: 'assetName' },
    },
    {
      field: 'assetRowNo',
      title: '行次',
      width: 64,
      align: 'center',
      formatter: ({ cellValue }) => cellValue || '',
    },
    {
      field: 'assetClosingAmount',
      title: '期末余额',
      width: 140,
      align: 'right',
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
    {
      field: 'assetOpeningAmount',
      title: '年初余额',
      width: 140,
      align: 'right',
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
    {
      field: 'liabilityName',
      title: '负债和所有者权益',
      minWidth: 250,
      slots: { default: 'liabilityName' },
    },
    {
      field: 'liabilityRowNo',
      title: '行次',
      width: 64,
      align: 'center',
      formatter: ({ cellValue }) => cellValue || '',
    },
    {
      field: 'liabilityClosingAmount',
      title: '期末余额',
      width: 140,
      align: 'right',
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
    {
      field: 'liabilityOpeningAmount',
      title: '年初余额',
      width: 140,
      align: 'right',
      formatter: ({ cellValue }) => formatMoney(cellValue),
    },
  ];
}
