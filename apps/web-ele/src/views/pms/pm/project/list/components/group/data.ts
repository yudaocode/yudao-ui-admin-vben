import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectGroupApi } from '#/api/pms/pm/project/group';

import { DICT_TYPE } from '@vben/constants';

/** 新增/修改的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        maxlength: 20,
        placeholder: '请输入分组名称',
        showWordLimit: true,
      },
      fieldName: 'name',
      label: '分组名称',
      rules: 'required',
    },
  ];
}
/** 分组列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PmsProjectGroupApi.ProjectGroup>['columns'] {
  return [
    {
      field: 'sort',
      title: '',
      width: 60,
      slots: { default: 'sort' },
    },
    {
      field: 'name',
      title: '分组名称',
      minWidth: 200,
    },
    {
      field: 'type',
      title: '分组类型',
      width: 130,
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PMS_PROJECT_GROUP_TYPE },
      },
    },
    {
      field: 'projectCount',
      title: '项目数量',
      width: 130,
    },
    {
      title: '操作',
      width: 140,
      slots: { default: 'actions' },
    },
  ];
}
