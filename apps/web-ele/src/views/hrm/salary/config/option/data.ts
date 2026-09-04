import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';

export type SalaryOptionTab = 'enterprise' | 'system';

/** 新增企业工资项表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'parentCode',
      label: '工资项分类',
      component: 'Select',
      rules: 'required',
      componentProps: {
        disabled: true,
        options: [],
        placeholder: '请选择工资项分类',
      },
    },
    {
      fieldName: 'name',
      label: '工资项名称',
      component: 'Input',
      rules: 'required',
      componentProps: { maxlength: 64, placeholder: '请输入工资项名称' },
    },
    {
      fieldName: 'remark',
      label: '备注',
      component: 'Textarea',
      componentProps: { maxlength: 255, placeholder: '请输入备注', rows: 3 },
    },
  ];
}

/** 工资项是否为分类 */
export function isSalaryOptionCategory(
  option: HrmSalaryOptionApi.SalaryOption,
) {
  return !option.parentCode;
}

/** 工资项是否为企业可选分类 */
export function isOptionalSalaryCategory(
  option: HrmSalaryOptionApi.SalaryOption,
) {
  return (
    isSalaryOptionCategory(option) && !!option.templateId && !option.systemFlag
  );
}

/** 工资项是否为企业项目 */
export function isEnterpriseSalaryOption(
  option: HrmSalaryOptionApi.SalaryOption,
) {
  return !isSalaryOptionCategory(option) && !option.systemFlag;
}

/** 工资项是否为系统标准项 */
export function isSystemStandardSalaryOption(
  option: HrmSalaryOptionApi.SalaryOption,
) {
  return (
    !isSalaryOptionCategory(option) && !!option.templateId && option.systemFlag
  );
}

/** 按页签过滤工资项，并隐藏未启用的企业项目 */
export function filterSalaryOptions(
  options: HrmSalaryOptionApi.SalaryOption[],
  tab: SalaryOptionTab,
) {
  if (tab === 'system') {
    return options.filter((item) => item.systemFlag);
  }
  const enabledCategoryCodes = new Set(
    options
      .filter(
        (item) =>
          !item.systemFlag && isSalaryOptionCategory(item) && item.enabled,
      )
      .map((item) => item.code),
  );
  return options.filter(
    (item) =>
      !item.systemFlag &&
      (isSalaryOptionCategory(item) ||
        (!!item.enabled && enabledCategoryCodes.has(item.parentCode!))),
  );
}

/** 获取分类下尚未启用的标准工资项 */
export function getInactiveSalaryStandardOptions(
  options: HrmSalaryOptionApi.SalaryOption[],
  category: HrmSalaryOptionApi.SalaryOption,
) {
  return options.filter(
    (item) =>
      item.parentCode === category.code && item.templateId && !item.enabled,
  );
}

/** 工资项列表字段 */
export function useGridColumns(
  tab: SalaryOptionTab,
): VxeTableGridOptions<HrmSalaryOptionApi.SalaryOption>['columns'] {
  return [
    {
      field: 'name',
      title: '薪资项',
      minWidth: 220,
      treeNode: true,
      showOverflow: true,
    },
    { title: '类型', width: 100, align: 'center', slots: { default: 'type' } },
    {
      title: '加减类型',
      width: 100,
      align: 'center',
      slots: { default: 'optionType' },
    },
    { title: '计税', width: 90, align: 'center', slots: { default: 'tax' } },
    {
      title: tab === 'enterprise' ? '分类状态' : '显示状态',
      width: 100,
      align: 'center',
      slots: { default: 'status' },
    },
    { field: 'remark', title: '备注', minWidth: 220, showOverflow: true },
    ...(tab === 'enterprise'
      ? [
          {
            title: '操作',
            width: 150,
            align: 'center' as const,
            fixed: 'right' as const,
            slots: { default: 'actions' },
          },
        ]
      : []),
  ];
}
