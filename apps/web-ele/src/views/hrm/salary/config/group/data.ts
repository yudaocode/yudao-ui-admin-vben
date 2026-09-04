import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { markRaw } from 'vue';

import { handleTree } from '@vben/utils';

import { z } from '#/adapter/form';
import { getSimpleDeptList } from '#/api/system/dept';
import HrmEmployeeMultiSelect from '#/views/hrm/employee/components/employee-multi-select.vue';
import { formatSalaryGroupScope } from '#/views/hrm/utils/format';

import TaxRuleSelect from '../tax-rule/components/tax-rule-select.vue';

/** 新增/修改薪资组表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'id',
      component: 'Input',
      dependencies: { triggerFields: [''], show: () => false },
    },
    {
      fieldName: 'name',
      label: '薪资组',
      component: 'Input',
      rules: 'required',
      componentProps: { maxlength: 64, placeholder: '请输入薪资组名称' },
    },
    {
      fieldName: 'taxRuleId',
      label: '计税规则',
      component: markRaw(TaxRuleSelect),
      rules: 'required',
    },
    {
      fieldName: 'deptIds',
      label: '部门范围',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        childrenField: 'children',
        labelField: 'name',
        multiple: true,
        placeholder: '请选择部门',
        treeDefaultExpandAll: true,
        valueField: 'id',
      },
    },
    {
      fieldName: 'employeeIds',
      label: '员工范围',
      component: markRaw(HrmEmployeeMultiSelect),
      componentProps: {
        placeholder: '请选择员工',
        title: '选择薪资组员工',
      },
      dependencies: {
        triggerFields: ['deptIds'],
        rules: (values) =>
          z
            .array(z.number())
            .optional()
            .refine(
              (employeeIds) =>
                !!values.deptIds?.length || !!employeeIds?.length,
              { message: '适用部门和适用员工不能同时为空' },
            ),
      },
    },
  ];
}

export function useGridColumns(): VxeGridProps['columns'] {
  return [
    { field: 'name', title: '薪资组名称', minWidth: 150 },
    {
      field: 'salaryStandard',
      title: '计薪标准',
      width: 120,
      formatter: ({ cellValue }) => `${cellValue ?? 0} 天/月`,
    },
    { field: 'taxRuleName', title: '计税规则', minWidth: 150 },
    { field: 'changeRule', title: '调薪规则', minWidth: 220 },
    {
      field: 'scope',
      title: '适用范围',
      minWidth: 180,
      formatter: ({ row }) => formatSalaryGroupScope(row),
    },
    {
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
