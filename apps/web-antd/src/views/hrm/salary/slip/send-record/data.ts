import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalarySlipSendRecordApi } from '#/api/hrm/salary/slip/send-record';

import { formatDate } from '@vben/utils';

export { formatHrmYearMonth } from '#/views/hrm/utils/format';
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'month',
      label: '工资月份',
      component: 'DatePicker',
      defaultValue: formatDate(new Date(), 'YYYY-MM'),
      componentProps: {
        allowClear: true,
        class: 'w-full',
        picker: 'month',
        valueFormat: 'YYYY-MM',
      },
    },
  ];
}

/** 构建列表查询参数 */
export function buildSendRecordQueryParams(
  formValues: Record<string, unknown>,
) {
  const month = formValues.month as string | undefined;
  const [year, monthValue] = month ? month.split('-').map(Number) : [];
  return {
    year,
    month: monthValue,
  };
}

/** 列表字段 */
export function useGridColumns(): VxeTableGridOptions<HrmSalarySlipSendRecordApi.SalarySlipSendRecord>['columns'] {
  return [
    {
      field: 'month',
      title: '工资月份',
      width: 120,
      align: 'center',
      slots: { default: 'month' },
    },
    {
      field: 'creatorName',
      title: '创建人',
      minWidth: 120,
      showOverflow: true,
    },
    {
      field: 'createTime',
      title: '发放时间',
      width: 180,
      align: 'center',
      formatter: 'formatDateTime',
    },
    {
      field: 'employeeCount',
      title: '工资表总人数',
      width: 130,
      align: 'center',
    },
    {
      field: 'sendEmployeeCount',
      title: '发放人数',
      width: 110,
      align: 'center',
    },
    {
      field: 'readCount',
      title: '已查看人数',
      width: 110,
      align: 'center',
    },
    {
      field: 'actions',
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
