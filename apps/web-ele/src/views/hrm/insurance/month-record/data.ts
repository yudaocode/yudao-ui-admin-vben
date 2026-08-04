import type { TableColumnCtx } from 'element-plus';

import type { HrmInsuranceMonthRecordApi } from '#/api/hrm/insurance/month-record';

import { formatHrmMoney } from '#/views/hrm/utils/format';

type MonthRecord = HrmInsuranceMonthRecordApi.InsuranceMonthRecord;

export type ListColumn = Partial<TableColumnCtx<MonthRecord>> & {
  prop?: 'action' | keyof MonthRecord;
  slot?: 'action' | 'title';
};

/** 月度社保表列表列（对齐 antd data.ts，仅保留组件库差异） */
export function useListColumns(): ListColumn[] {
  return [
    {
      label: '社保表',
      prop: 'title',
      fixed: 'left',
      minWidth: 190,
      slot: 'title',
    },
    {
      label: '参保人数',
      prop: 'insuredEmployeeCount',
      align: 'center',
      width: 100,
    },
    {
      label: '停保人数',
      prop: 'stoppedEmployeeCount',
      align: 'center',
      width: 100,
    },
    {
      label: '个人社保',
      prop: 'personalInsuranceAmount',
      align: 'right',
      width: 120,
      formatter: (row) => formatHrmMoney(row.personalInsuranceAmount),
    },
    {
      label: '公司社保',
      prop: 'corporateInsuranceAmount',
      align: 'right',
      width: 120,
      formatter: (row) => formatHrmMoney(row.corporateInsuranceAmount),
    },
    {
      label: '个人公积金',
      prop: 'personalProvidentFundAmount',
      align: 'right',
      width: 130,
      formatter: (row) => formatHrmMoney(row.personalProvidentFundAmount),
    },
    {
      label: '公司公积金',
      prop: 'corporateProvidentFundAmount',
      align: 'right',
      width: 130,
      formatter: (row) => formatHrmMoney(row.corporateProvidentFundAmount),
    },
    {
      label: '操作',
      prop: 'action',
      align: 'center',
      fixed: 'right',
      width: 80,
      slot: 'action',
    },
  ];
}
