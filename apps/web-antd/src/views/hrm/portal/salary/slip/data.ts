import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPortalSalarySlipApi } from '#/api/hrm/portal/salary/slip';

import {
  HRM_SALARY_SLIP_SORT_OPTIONS,
  HrmSalarySlipSort,
} from '#/views/hrm/utils/constants';
import { formatHrmMoney } from '#/views/hrm/utils/format';

export interface SalarySlipFilterValues {
  monthRange?: string[];
  sort?: number;
}

/** 工资条筛选表单 */
export function useFilterFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'monthRange',
      label: '所属月份',
      component: 'RangePicker',
      componentProps: {
        allowClear: true,
        picker: 'month',
        placeholder: ['开始月份', '结束月份'],
        valueFormat: 'YYYY-MM',
      },
    },
    {
      fieldName: 'sort',
      label: '排序方式',
      component: 'Select',
      defaultValue: HrmSalarySlipSort.RECENT_SEND,
      componentProps: {
        allowClear: false,
        options: [...HRM_SALARY_SLIP_SORT_OPTIONS],
      },
    },
  ];
}

/** 构建工资条查询参数 */
export function buildSalarySlipListParams(
  values: SalarySlipFilterValues,
): HrmPortalSalarySlipApi.SlipListReq {
  const params: HrmPortalSalarySlipApi.SlipListReq = {};
  if (values.monthRange?.length === 2) {
    [params.startMonth, params.endMonth] = values.monthRange;
  }
  const sortOption = HRM_SALARY_SLIP_SORT_OPTIONS.find(
    (item) => item.value === values.sort,
  );
  if (sortOption) {
    params.orderType = sortOption.orderType;
    params.order = sortOption.order;
  }
  return params;
}

/** 获取工资条末级项目 */
export function getLeafSalarySlipOptions(
  options: HrmPortalSalarySlipApi.SlipOption[],
): HrmPortalSalarySlipApi.SlipOption[] {
  return options.flatMap((option) =>
    option.children?.length
      ? getLeafSalarySlipOptions(option.children)
      : [option],
  );
}

/** 构建工资条展示行 */
export function buildSalarySlipRow(
  slip: HrmPortalSalarySlipApi.PortalSalarySlip,
) {
  const row: Record<string, number | string> = {
    monthTitle: `${slip.year}-${String(slip.month).padStart(2, '0')}`,
  };
  for (const option of getLeafSalarySlipOptions(slip.options)) {
    row[`option${option.code}`] = option.value || 0;
  }
  return row;
}

function buildSalarySlipOptionColumn(
  option: HrmPortalSalarySlipApi.SlipOption,
): NonNullable<VxeTableGridOptions['columns']>[number] {
  if (option.children?.length) {
    return {
      title: option.name,
      align: 'center',
      children: option.children.map(buildSalarySlipOptionColumn),
    };
  }
  return {
    field: `option${option.code}`,
    title: option.name,
    minWidth: 120,
    align: 'right',
    formatter: ({ cellValue }) => `¥ ${formatHrmMoney(Number(cellValue || 0))}`,
    params: { remark: option.remark },
    slots: option.remark ? { header: 'optionHeader' } : undefined,
  };
}

/** 工资条动态字段 */
export function useSalarySlipGridColumns(
  slip: HrmPortalSalarySlipApi.PortalSalarySlip,
): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'monthTitle',
      title: '所属月份',
      width: 110,
      fixed: 'left',
    },
    ...slip.options.map(buildSalarySlipOptionColumn),
  ];
}
