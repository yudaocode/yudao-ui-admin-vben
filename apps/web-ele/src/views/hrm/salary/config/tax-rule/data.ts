import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import {
  HrmSalaryTaxCycleType,
  HrmSalaryTaxCycleTypeOptions,
  HrmSalaryTaxType,
} from '#/views/hrm/utils/constants';
import { formatHrmYesNo } from '#/views/hrm/utils/format';

/** 新增/修改计税规则表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'name',
      label: '方案名称',
      component: 'Input',
      rules: 'required',
      componentProps: { maxlength: 64, placeholder: '请输入方案名称' },
    },
    {
      fieldName: 'type',
      label: '个税类型',
      component: 'Select',
      rules: z.number().default(HrmSalaryTaxType.SALARY),
      componentProps: {
        options: getDictOptions(DICT_TYPE.HRM_SALARY_TAX_TYPE, 'number'),
        placeholder: '请选择个税类型',
      },
    },
    {
      fieldName: 'taxEnabled',
      label: '是否计税',
      component: 'Switch',
      rules: z.boolean().default(true),
      dependencies: {
        triggerFields: ['type'],
        disabled: (values) => values.type === HrmSalaryTaxType.NONE,
      },
    },
    {
      fieldName: 'threshold',
      label: '起征点',
      component: 'InputNumber',
      help: '工资薪金默认 5000 元，劳务报酬默认 800 元',
      componentProps: { min: 0, precision: 2 },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type !== HrmSalaryTaxType.NONE,
        rules: (values) =>
          values.type === HrmSalaryTaxType.NONE
            ? z.number().optional()
            : z.number().min(0, { message: '起征点不能小于 0' }),
      },
    },
    {
      fieldName: 'decimalScale',
      label: '小数位',
      component: 'InputNumber',
      help: '个税计算结果保留 0～4 位小数',
      componentProps: { max: 4, min: 0 },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type !== HrmSalaryTaxType.NONE,
        rules: (values) =>
          values.type === HrmSalaryTaxType.NONE
            ? z.number().optional()
            : z.number().min(0).max(4),
      },
    },
    {
      fieldName: 'cycleType',
      label: '计税周期',
      component: 'RadioGroup',
      componentProps: { options: HrmSalaryTaxCycleTypeOptions },
      dependencies: {
        triggerFields: ['type'],
        show: (values) => values.type === HrmSalaryTaxType.SALARY,
        rules: (values) =>
          values.type === HrmSalaryTaxType.SALARY
            ? z.number().default(HrmSalaryTaxCycleType.JANUARY_TO_DECEMBER)
            : z.number().optional(),
      },
    },
  ];
}

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
