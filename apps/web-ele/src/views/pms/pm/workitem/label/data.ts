import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsWorkItemLabelApi } from '#/api/pms/pm/workitem/label';

import { markRaw } from 'vue';

import { ElColorPicker } from 'element-plus';

/** 新增/编辑工作项标签的表单 */
export function useLabelFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        maxlength: 50,
        placeholder: '请输入标签名称',
      },
      fieldName: 'name',
      label: '标签名称',
      rules: 'required',
    },
    {
      component: markRaw(ElColorPicker),
      defaultValue: '#409EFF',
      fieldName: 'color',
      label: '标签颜色',
      rules: 'required',
    },
  ];
}

/** 标签列表的字段 */
export function useLabelGridColumns(): VxeTableGridOptions<PmsWorkItemLabelApi.WorkItemLabel>['columns'] {
  return [
    {
      field: 'name',
      title: '标签',
      minWidth: 220,
      slots: { default: 'name' },
    },
    {
      align: 'center',
      field: 'color',
      title: '颜色',
      width: 140,
    },
    {
      align: 'center',
      title: '操作',
      width: 160,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
