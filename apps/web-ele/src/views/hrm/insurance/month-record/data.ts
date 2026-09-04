import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmInsuranceMonthRecordApi } from '#/api/hrm/insurance/month-record';

import { formatDate } from '@vben/utils';

import { formatHrmMoney } from '#/views/hrm/utils/format';

/** 列表搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'year',
      label: '年份',
      component: 'DatePicker',
      defaultValue: formatDate(new Date(), 'YYYY'),
      componentProps: {
        allowClear: false,
        class: 'w-full',
        format: 'YYYY 年',
        picker: 'year',
        valueFormat: 'YYYY',
      },
    },
  ];
}

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<HrmInsuranceMonthRecordApi.InsuranceMonthRecord>['columns'] {
  return [
    {
      field: 'title',
      title: '社保表',
      fixed: 'left',
      minWidth: 190,
      slots: { default: 'title' },
    },
    {
      field: 'insuredEmployeeCount',
      title: '参保人数',
      align: 'center',
      width: 100,
    },
    {
      field: 'stoppedEmployeeCount',
      title: '停保人数',
      align: 'center',
      width: 100,
    },
    {
      field: 'personalInsuranceAmount',
      title: '个人社保',
      align: 'right',
      width: 120,
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'corporateInsuranceAmount',
      title: '公司社保',
      align: 'right',
      width: 120,
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'personalProvidentFundAmount',
      title: '个人公积金',
      align: 'right',
      width: 130,
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'corporateProvidentFundAmount',
      title: '公司公积金',
      align: 'right',
      width: 130,
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      title: '操作',
      align: 'center',
      fixed: 'right',
      width: 80,
      slots: { default: 'actions' },
    },
  ];
}
