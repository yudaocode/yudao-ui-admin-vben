import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeInteractionApi } from '#/api/pms/kb/interaction/types';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PmsKnowledgeInteractionApi.KnowledgeInteractionItem>['columns'] {
  return [
    {
      field: 'name',
      title: '名称',
      minWidth: 260,
      align: 'left',
      slots: { default: 'name' },
    },
    {
      field: 'type',
      title: '类型',
      width: 100,
      align: 'left',
      cellRender: { name: 'CellDict', props: { type: DICT_TYPE.PMS_KNOWLEDGE_OBJECT_TYPE } },
    },
    {
      field: 'libraryName',
      title: '所属知识库',
      width: 180,
      align: 'left',
    },
    {
      field: 'targetUpdateTime',
      title: '内容更新时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      field: 'createTime',
      title: '关注时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '是否关注',
      width: 100,
      fixed: 'right',
      slots: { default: 'favorite' },
    },
  ];
}
