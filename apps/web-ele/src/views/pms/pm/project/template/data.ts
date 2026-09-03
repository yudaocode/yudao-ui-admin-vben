import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectTemplateApi } from '#/api/pms/pm/project/template';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { PmsProjectType } from '#/views/pms/pm/utils/constants';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '模板名称',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入模板名称',
      },
    },
    {
      fieldName: 'projectType',
      label: '项目类型',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '通用项目', value: PmsProjectType.GENERAL },
          { label: '敏捷开发项目', value: PmsProjectType.AGILE },
        ],
        placeholder: '请选择项目类型',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择状态',
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PmsProjectTemplateApi.ProjectTemplate>['columns'] {
  return [
    {
      field: 'name',
      title: '模板名称',
      minWidth: 180,
      align: 'center',
    },
    {
      field: 'projectType',
      title: '项目类型',
      width: 140,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PMS_PROJECT_TYPE },
      },
    },
    {
      field: 'itemTypes',
      title: '事项类型',
      minWidth: 180,
      align: 'center',
      slots: { default: 'itemTypes' },
    },
    {
      field: 'statusCount',
      title: '状态数',
      width: 90,
      align: 'center',
      slots: { default: 'statusCount' },
    },
    {
      field: 'boardCount',
      title: '看板列数',
      width: 100,
      align: 'center',
      slots: { default: 'boardCount' },
    },
    {
      field: 'status',
      title: '状态',
      width: 90,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.COMMON_STATUS },
      },
    },
    {
      field: 'sort',
      title: '排序',
      width: 80,
      align: 'center',
    },
    {
      field: 'createTime',
      title: '创建时间',
      width: 180,
      align: 'center',
      slots: { default: 'createTime' },
    },
    {
      title: '操作',
      width: 140,
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
