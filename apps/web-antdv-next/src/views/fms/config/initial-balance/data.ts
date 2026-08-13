import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsInitialBalanceApi } from '#/api/fms/config/initial-balance';

/** 初始余额表格行：科目行与辅助核算明细行平铺展示 */
export type FmsInitialBalanceViewRow =
  FmsInitialBalanceApi.InitialBalance & {
    auxiliaries?: FmsInitialBalanceApi.AuxiliaryItem[];
    auxiliaryItemIds?: number[];
    isAssist?: boolean;
    isLeaf?: boolean;
    level: number;
    rowKey: string;
  };

/** 金额和数量字段，父级行由子级行汇总 */
export const AMOUNT_FIELDS: (keyof FmsInitialBalanceApi.Amounts)[] = [
  'openingAmount',
  'openingQuantity',
  'yearDebitAmount',
  'yearDebitQuantity',
  'yearCreditAmount',
  'yearCreditQuantity',
  'yearOpeningAmount',
  'yearOpeningQuantity',
  'profitLossAmount',
  'profitLossQuantity',
];

/** 汇总时不区分余额方向、直接累加的字段 */
export const DIRECT_SUM_FIELDS: Set<keyof FmsInitialBalanceApi.Amounts> =
  new Set([
    'yearCreditAmount',
    'yearCreditQuantity',
    'yearDebitAmount',
    'yearDebitQuantity',
  ]);

/** 列表字段 */
export function useGridColumns(options: {
  isJanuary: boolean;
  showProfitLoss: boolean;
}): VxeTableGridOptions<FmsInitialBalanceViewRow>['columns'] {
  const columns: VxeTableGridOptions<FmsInitialBalanceViewRow>['columns'] = [
    {
      field: 'subjectCode',
      title: '科目编码',
      minWidth: 140,
      fixed: 'left',
      slots: { default: 'subjectCode' },
    },
    {
      field: 'subjectName',
      title: '科目名称',
      minWidth: 240,
      fixed: 'left',
      slots: { default: 'subjectName' },
    },
    {
      field: 'balanceDirection',
      title: '方向',
      width: 72,
      align: 'center',
      fixed: 'left',
      slots: { default: 'balanceDirection' },
    },
    {
      title: '期初余额',
      align: 'center',
      children: [
        {
          field: 'openingQuantity',
          title: '数量',
          minWidth: 135,
          align: 'right',
          slots: { default: 'openingQuantity' },
        },
        {
          field: 'openingAmount',
          title: '金额',
          minWidth: 145,
          align: 'right',
          slots: { default: 'openingAmount' },
        },
      ],
    },
  ];
  // 账套从一月启用时只需录入期初余额，不展示累计发生额、年初余额和实际损益
  if (options.isJanuary) {
    return columns;
  }
  columns.push(
    {
      title: '本年累计借方',
      align: 'center',
      children: [
        {
          field: 'yearDebitQuantity',
          title: '数量',
          minWidth: 135,
          align: 'right',
          slots: { default: 'yearDebitQuantity' },
        },
        {
          field: 'yearDebitAmount',
          title: '金额',
          minWidth: 145,
          align: 'right',
          slots: { default: 'yearDebitAmount' },
        },
      ],
    },
    {
      title: '本年累计贷方',
      align: 'center',
      children: [
        {
          field: 'yearCreditQuantity',
          title: '数量',
          minWidth: 135,
          align: 'right',
          slots: { default: 'yearCreditQuantity' },
        },
        {
          field: 'yearCreditAmount',
          title: '金额',
          minWidth: 145,
          align: 'right',
          slots: { default: 'yearCreditAmount' },
        },
      ],
    },
    {
      title: '年初余额',
      align: 'center',
      children: [
        {
          field: 'yearOpeningQuantity',
          title: '数量',
          minWidth: 135,
          align: 'right',
          slots: { default: 'yearOpeningQuantity' },
        },
        {
          field: 'yearOpeningAmount',
          title: '金额',
          minWidth: 145,
          align: 'right',
          slots: { default: 'yearOpeningAmount' },
        },
      ],
    },
  );
  if (options.showProfitLoss) {
    columns.push({
      title: '实际损益发生额',
      align: 'center',
      children: [
        {
          field: 'profitLossQuantity',
          title: '数量',
          minWidth: 135,
          align: 'right',
          slots: { default: 'profitLossQuantity' },
        },
        {
          field: 'profitLossAmount',
          title: '金额',
          minWidth: 145,
          align: 'right',
          slots: { default: 'profitLossAmount' },
        },
      ],
    });
  }
  return columns;
}
