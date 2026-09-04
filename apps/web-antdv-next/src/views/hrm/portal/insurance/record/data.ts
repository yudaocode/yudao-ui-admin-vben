import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPortalInsuranceRecordApi } from '#/api/hrm/portal/insurance/record';

import { formatDate } from '@vben/utils';

import { formatHrmMoney, formatHrmRate } from '#/views/hrm/utils/format';

/** 列表搜索表单 */
export function useGridFormSchema(
  disabledDate?: (value: unknown) => boolean,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'year',
      label: '年份',
      component: 'DatePicker',
      defaultValue: formatDate(new Date(), 'YYYY'),
      componentProps: {
        allowClear: false,
        class: 'w-full',
        disabledDate,
        format: 'YYYY 年',
        picker: 'year',
        valueFormat: 'YYYY',
      },
    },
  ];
}

/** 计算参保记录合计 */
export function getInsuranceRecordTotal(
  record?: Partial<HrmPortalInsuranceRecordApi.PortalInsuranceRecord>,
) {
  return (
    Number(record?.personalInsuranceAmount || 0) +
    Number(record?.corporateInsuranceAmount || 0) +
    Number(record?.personalProvidentFundAmount || 0) +
    Number(record?.corporateProvidentFundAmount || 0)
  );
}

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<HrmPortalInsuranceRecordApi.PortalInsuranceRecord>['columns'] {
  return [
    {
      field: 'month',
      title: '所属月份',
      width: 110,
      fixed: 'left',
      formatter: ({ row }) =>
        `${row.year}-${String(row.month).padStart(2, '0')}`,
    },
    {
      field: 'schemeName',
      title: '参保方案',
      minWidth: 210,
      slots: { default: 'schemeName' },
    },
    {
      field: 'schemeType',
      title: '方案类型',
      width: 100,
      align: 'center',
      slots: { default: 'schemeType' },
    },
    ...[
      ['personalInsuranceAmount', '个人社保'],
      ['corporateInsuranceAmount', '公司社保'],
      ['personalProvidentFundAmount', '个人公积金'],
      ['corporateProvidentFundAmount', '公司公积金'],
    ].map(([field, title]) => ({
      field,
      title,
      minWidth: 130,
      align: 'right' as const,
      formatter: ({ cellValue }: { cellValue: unknown }) =>
        `¥ ${formatHrmMoney(Number(cellValue || 0))}`,
    })),
    {
      field: 'totalAmount',
      title: '合计',
      minWidth: 140,
      align: 'right',
      formatter: ({ row }) =>
        `¥ ${formatHrmMoney(getInsuranceRecordTotal(row))}`,
    },
    {
      title: '操作',
      width: 100,
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}

/** 详情项目字段 */
export function useProjectGridColumns(
  showProportion: boolean,
): VxeTableGridOptions<HrmPortalInsuranceRecordApi.SchemeProject>['columns'] {
  return [
    { field: 'name', title: '缴纳项目', minWidth: 150 },
    {
      field: 'baseAmount',
      title: '缴纳基数',
      width: 130,
      align: 'right',
      formatter: ({ cellValue }) =>
        `¥ ${formatHrmMoney(Number(cellValue || 0))}`,
    },
    ...(showProportion
      ? [
          {
            field: 'personalRate',
            title: '个人比例',
            width: 110,
            align: 'right' as const,
            formatter: ({ cellValue }: { cellValue: unknown }) =>
              formatHrmRate(Number(cellValue)),
          },
        ]
      : []),
    {
      field: 'personalAmount',
      title: '个人金额',
      width: 130,
      align: 'right',
      formatter: ({ cellValue }) =>
        `¥ ${formatHrmMoney(Number(cellValue || 0))}`,
    },
    ...(showProportion
      ? [
          {
            field: 'corporateRate',
            title: '公司比例',
            width: 110,
            align: 'right' as const,
            formatter: ({ cellValue }: { cellValue: unknown }) =>
              formatHrmRate(Number(cellValue)),
          },
        ]
      : []),
    {
      field: 'corporateAmount',
      title: '公司金额',
      width: 130,
      align: 'right',
      formatter: ({ cellValue }) =>
        `¥ ${formatHrmMoney(Number(cellValue || 0))}`,
    },
    {
      field: 'totalAmount',
      title: '合计',
      width: 130,
      align: 'right',
      formatter: ({ row }) =>
        `¥ ${formatHrmMoney(Number(row.personalAmount || 0) + Number(row.corporateAmount || 0))}`,
    },
  ];
}

/** 详情项目合计行 */
export function buildProjectFooterMethod() {
  return ({
    columns,
    data,
  }: {
    columns: Array<{ field?: string }>;
    data: HrmPortalInsuranceRecordApi.SchemeProject[];
  }) => [
    columns.map((column, index) => {
      if (index === 0) return '合计';
      if (
        column.field === 'personalAmount' ||
        column.field === 'corporateAmount'
      ) {
        return `¥ ${formatHrmMoney(
          data.reduce(
            (sum, item) =>
              sum +
              Number(
                column.field === 'personalAmount'
                  ? (item.personalAmount ?? 0)
                  : (item.corporateAmount ?? 0),
              ),
            0,
          ),
        )}`;
      }
      if (column.field === 'totalAmount') {
        return `¥ ${formatHrmMoney(
          data.reduce(
            (sum, item) =>
              sum +
              Number(item.personalAmount || 0) +
              Number(item.corporateAmount || 0),
            0,
          ),
        )}`;
      }
      return '';
    }),
  ];
}
