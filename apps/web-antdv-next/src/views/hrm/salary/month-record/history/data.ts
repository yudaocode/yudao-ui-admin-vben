import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryMonthRecordApi } from '#/api/hrm/salary/month-record';

import { formatDate } from '@vben/utils';

import { formatHrmMoney, formatHrmYearMonth } from '#/views/hrm/utils/format';

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'year',
      label: '年份',
      component: 'DatePicker',
      defaultValue: formatDate(new Date(), 'YYYY'),
      componentProps: {
        allowClear: true,
        class: 'w-full',
        picker: 'year',
        valueFormat: 'YYYY',
      },
    },
  ];
}

/** 构建列表查询参数 */
export function buildHistoryQueryParams(formValues: Record<string, unknown>) {
  return {
    year: formValues.year ? Number(formValues.year) : undefined,
  };
}

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<HrmSalaryMonthRecordApi.SalaryMonthRecord>['columns'] {
  return [
    {
      field: 'title',
      title: '工资表',
      minWidth: 180,
      fixed: 'left',
      showOverflow: true,
      slots: { default: 'title' },
    },
    {
      field: 'month',
      title: '月份',
      width: 100,
      align: 'center',
      formatter: ({ row }) => formatHrmYearMonth(row.year, row.month),
    },
    {
      field: 'employeeCount',
      title: '计薪人数',
      width: 100,
      align: 'center',
    },
    {
      field: 'expectedPaySalary',
      title: '应发工资',
      width: 130,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'realPaySalary',
      title: '实发工资',
      width: 130,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'personalTax',
      title: '个税总额',
      width: 130,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'actions',
      title: '操作',
      width: 90,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
