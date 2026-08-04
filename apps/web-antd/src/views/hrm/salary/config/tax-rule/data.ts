import type { VxeGridProps } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';

import { HrmSalaryTaxCycleTypeOptions } from '#/views/hrm/utils/constants';
import { formatHrmYesNo } from '#/views/hrm/utils/format';

export function useGridColumns(): VxeGridProps['columns'] {
  return [
    { field: 'name', title: '方案名称', minWidth: 180 },
    {
      field: 'type',
      title: '个税类型',
      width: 140,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.HRM_SALARY_TAX_TYPE },
      },
    },
    {
      field: 'cycleType',
      title: '计税周期',
      minWidth: 360,
      formatter: ({ cellValue }) =>
        HrmSalaryTaxCycleTypeOptions.find((item) => item.value === cellValue)
          ?.label || '-',
    },
    {
      field: 'taxEnabled',
      title: '是否计税',
      width: 100,
      formatter: ({ cellValue }) =>
        cellValue === null ? '-' : formatHrmYesNo(cellValue),
    },
    {
      field: 'threshold',
      title: '起征点',
      width: 120,
      formatter: ({ cellValue }) =>
        cellValue === null ? '-' : `${cellValue}元/月`,
    },
    {
      field: 'decimalScale',
      title: '个税结果保留小数位',
      width: 170,
      formatter: ({ cellValue }) =>
        cellValue === null ? '-' : `保留${cellValue}位小数`,
    },
    {
      field: 'usedGroupCount',
      title: '适用薪资组',
      minWidth: 170,
      formatter: ({ cellValue }) => `${cellValue ?? 0}个薪资组正在使用`,
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
