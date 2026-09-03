import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeLibraryTemplateApi } from '#/api/pms/kb/library/template';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '模板名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入模板名称',
        allowClear: true,
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: getDictOptions(DICT_TYPE.COMMON_STATUS, 'number'),
        placeholder: '请选择模板状态',
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PmsKnowledgeLibraryTemplateApi.KnowledgeLibraryTemplate>['columns'] {
  return [
    {
      field: 'name',
      title: '模板名称',
      width: 180,
      align: 'center',
    },
    {
      field: 'description',
      title: '模板描述',
      minWidth: 260,
      align: 'center',
      showOverflow: 'ellipsis',
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      align: 'center',
      slots: { default: 'status' },
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
      formatter: 'formatDateTime',
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
