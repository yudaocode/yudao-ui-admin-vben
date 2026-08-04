import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';
import type { HrmSalaryMonthEmployeeRecordApi } from '#/api/hrm/salary/month-record/employee';

import { handleTree } from '@vben/utils';

import { getSimpleDeptList } from '#/api/system/dept';
import {
  getSalaryLeafOptions,
  getSalaryOptionValue,
} from '#/views/hrm/salary/utils/option';
import { formatHrmDays, formatHrmMoney } from '#/views/hrm/utils/format';

/** 部门单选 ApiTreeSelect 配置 */
export function useDeptTreeSelectProps() {
  return {
    allowClear: true,
    api: async () => handleTree(await getSimpleDeptList()),
    class: 'w-full',
    fieldNames: { label: 'name', value: 'id', children: 'children' },
    placeholder: '请选择部门',
    treeDefaultExpandAll: true,
  };
}

/** 搜索表单 */
export function useSearchFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'employeeName',
      label: '员工姓名',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入员工姓名',
      },
    },
    {
      fieldName: 'jobNumber',
      label: '工号',
      component: 'Input',
      componentProps: {
        allowClear: true,
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
