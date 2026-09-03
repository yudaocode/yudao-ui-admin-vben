import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeRecycleApi } from '#/api/pms/kb/recycle';

import { DICT_TYPE } from '@vben/constants';

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PmsKnowledgeRecycleApi.KnowledgeRecycle>['columns'] {
  return [
    {
      field: 'name',
      title: '名称',
      minWidth: 240,
    },
    {
      field: 'type',
      title: '类型',
      width: 100,
      align: 'center',
      cellRender: {
        name: 'CellDict',
        props: { type: DICT_TYPE.PMS_KNOWLEDGE_OBJECT_TYPE },
      },
    },
    {
      field: 'deleteUserName',
      title: '删除人',
      width: 130,
    },
    {
      field: 'deleteTime',
      title: '删除时间',
      width: 180,
      slots: { default: 'deleteTime' },
    },
    {
      title: '操作',
      width: 150,
      align: 'center',
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
