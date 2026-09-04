import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';
import type { HrmSalaryMonthEmployeeRecordApi } from '#/api/hrm/salary/month-record/employee';

import { formatDateTime, handleTree } from '@vben/utils';

import { getSimpleDeptList } from '#/api/system/dept';
import {
  getSalaryLeafOptions,
  getSalaryOptionValue,
} from '#/views/hrm/salary/utils/option';
import { formatHrmDays, formatHrmMoney } from '#/views/hrm/utils/format';

/** 部门单选 ApiTreeSelect 配置 */
export function useDeptTreeSelectProps() {
  return {
    api: async () => handleTree(await getSimpleDeptList()),
    checkStrictly: true,
    class: 'w-full',
    clearable: true,
    defaultExpandAll: true,
    fieldNames: { label: 'name', value: 'id', children: 'children' },
    placeholder: '请选择部门',
  };
}

/** 搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'employeeName',
      label: '员工姓名',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入员工姓名',
      },
    },
    {
      fieldName: 'jobNumber',
      label: '工号',
      component: 'Input',
      componentProps: {
        clearable: true,
        placeholder: '请输入工号',
      },
    },
    {
      fieldName: 'deptId',
      label: '部门',
      component: 'ApiTreeSelect',
      componentProps: useDeptTreeSelectProps(),
    },
  ];
}

/** 构建动态表格列 */
export function buildGridColumns(
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
      title: '姓名',
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
    {
      align: 'right',
      field: 'needWorkDay',
      formatter: ({ cellValue }) => formatHrmDays(cellValue),
      title: '计薪天数',
      width: 110,
    },
    {
      align: 'right',
      field: 'actualWorkDay',
      formatter: ({ cellValue }) => formatHrmDays(cellValue),
      title: '实际计薪天数',
      width: 130,
    },
    ...optionColumns,
  ];
}

/** 在线编辑工资字段 */
export function buildEditableGridColumns(
  options: Array<Pick<HrmSalaryOptionApi.SalaryOption, 'code' | 'name'>>,
): VxeTableGridOptions<HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord>['columns'] {
  return [
    { field: 'employeeName', fixed: 'left', title: '员工姓名', minWidth: 150 },
    { field: 'jobNumber', fixed: 'left', title: '工号', width: 120 },
    { field: 'deptName', title: '部门', minWidth: 140 },
    { field: 'postName', title: '岗位', minWidth: 140 },
    ...options.map((option) => ({
      field: `option-${option.code}`,
      title: option.name,
      width: 150,
      slots: { default: 'optionValue' },
    })),
  ];
}

/** 构建合计行 */
export function buildFooterMethod(summaryMap: Record<number, number>) {
  return ({ columns }: { columns: Array<{ field?: string }> }) => {
    return [
      columns.map((column, index) => {
        if (index === 0) {
          return '合计';
        }
        const optionCode = Number(column.field?.replace('option-', ''));
        return Number.isSafeInteger(optionCode)
          ? formatHrmMoney(summaryMap[optionCode])
          : '';
      }),
    ];
  };
}
/** 工资核算就绪员工字段 */
export function usePayrollReadinessEmployeeGridColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'employeeName', title: '员工姓名', minWidth: 150 },
    { field: 'jobNumber', title: '工号', width: 120 },
    { field: 'deptName', title: '部门', minWidth: 150 },
    { field: 'postName', title: '岗位', minWidth: 150 },
    {
      field: 'status',
      title: '员工状态',
      width: 100,
      align: 'center',
      slots: { default: 'status' },
    },
    {
      field: 'entryTime',
      title: '入职日期',
      width: 180,
      formatter: ({ cellValue }) =>
        cellValue ? formatDateTime(cellValue as number | string) : '-',
    },
  ];
}
