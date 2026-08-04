import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';
import type { HrmSalaryMonthEmployeeRecordApi } from '#/api/hrm/salary/month-record/employee';

import {
  getSalaryLeafOptions,
  getSalaryOptionValue,
} from '#/views/hrm/salary/utils/option';
import { formatHrmMoney } from '#/views/hrm/utils/format';

export { buildFooterMethod, useSearchFormSchema } from '../data';

/** 构建详情员工明细列 */
export function buildDetailGridColumns(
  optionHeaders?: HrmSalaryOptionApi.SalaryOption[],
): VxeTableGridOptions<HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord>['columns'] {
  const optionColumns = getSalaryLeafOptions(optionHeaders).map((option) => ({
    align: 'right' as const,
    field: `option-${option.code}`,
    minWidth: 120,
    title: option.name,
    formatter: ({
      row,
    }: {
      row: HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord;
    }) => formatHrmMoney(getSalaryOptionValue(row, option.code)),
  }));
  return [
    {
      field: 'employeeName',
      fixed: 'left',
      minWidth: 130,
      title: '员工姓名',
    },
    {
      field: 'jobNumber',
      minWidth: 120,
      title: '工号',
    },
    {
      field: 'deptName',
      minWidth: 130,
      title: '部门',
    },
    {
      field: 'postName',
      minWidth: 130,
      title: '岗位',
    },
    ...optionColumns,
  ];
}
