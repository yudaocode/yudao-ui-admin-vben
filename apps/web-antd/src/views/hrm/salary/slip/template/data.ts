import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalarySlipTemplateApi } from '#/api/hrm/salary/slip/template';

/** 工资条模板明细字段 */
export function useTemplateOptionGridColumns(): VxeTableGridOptions<HrmSalarySlipTemplateApi.TemplateOption>['columns'] {
  return [
    { field: 'type', title: '类型', width: 80, slots: { default: 'type' } },
    { field: 'name', title: '名称', width: 160, slots: { default: 'name' } },
    {
      field: 'parentCode',
      title: '所属分类',
      width: 150,
      slots: { default: 'parentCode' },
    },
    {
      field: 'hidden',
      title: '显示',
      width: 80,
      slots: { default: 'hidden' },
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 190,
      slots: { default: 'remark' },
    },
    { title: '操作', width: 150, slots: { default: 'actions' } },
  ];
}
