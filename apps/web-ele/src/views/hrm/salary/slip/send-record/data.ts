import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalarySlipApi } from '#/api/hrm/salary/slip';
import type { HrmSalarySlipSendRecordApi } from '#/api/hrm/salary/slip/send-record';

import { formatDate } from '@vben/utils';

import { formatHrmMoney, formatHrmYearMonth } from '#/views/hrm/utils/format';

export { formatHrmYearMonth };
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'month',
      label: '工资月份',
      component: 'DatePicker',
      defaultValue: formatDate(new Date(), 'YYYY-MM'),
      componentProps: {
        clearable: true,
        class: 'w-full',
        type: 'month',
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

/** 工资条明细字段 */
export function useSlipOptionGridColumns(): VxeTableGridOptions<HrmSalarySlipApi.SlipOption>['columns'] {
  return [
    { field: 'name', title: '项目', minWidth: 240, treeNode: true },
    {
      field: 'value',
      title: '金额',
      width: 150,
      align: 'right',
      formatter: ({ row }) =>
        row.children?.length ? '-' : formatHrmMoney(row.value),
    },
  ];
}

/** 工资条发放员工字段 */
export function useSendEmployeeGridColumns(): VxeTableGridOptions<HrmSalarySlipSendRecordApi.SendEmployee>['columns'] {
  return [
    { type: 'checkbox', width: 50, fixed: 'left' },
    { field: 'employeeName', title: '员工', minWidth: 120, showOverflow: true },
    { field: 'jobNumber', title: '工号', width: 110, showOverflow: true },
    { field: 'deptName', title: '部门', minWidth: 130, showOverflow: true },
    { field: 'postName', title: '岗位', minWidth: 130, showOverflow: true },
    { field: 'mobile', title: '手机号', width: 130 },
    {
      field: 'sent',
      title: '发送状态',
      width: 100,
      formatter: ({ cellValue }) => (cellValue ? '已发送' : '未发送'),
    },
    {
      field: 'expectedPaySalary',
      title: '应发工资',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
    {
      field: 'realPaySalary',
      title: '实发工资',
      width: 120,
      align: 'right',
      formatter: ({ cellValue }) => formatHrmMoney(cellValue),
    },
  ];
}
