import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeInteractionApi } from '#/api/pms/kb/interaction/types';

import { DICT_TYPE } from '@vben/constants';

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PmsKnowledgeInteractionApi.KnowledgeInteractionItem>['columns'] {
  return [
    {
      field: 'name',
      title: '名称',
      minWidth: 260,
      slots: { default: 'name' },
    },
    {
      field: 'type',
      title: '类型',
      width: 100,
      cellRender: {
        name: 'CellDict',
        props: {
          type: DICT_TYPE.PMS_KNOWLEDGE_OBJECT_TYPE
        }
      },
    },
    {
      field: 'libraryName',
      title: '所属知识库',
      width: 180,
    },
    {
      field: 'createTime',
      title: '浏览时间',
      width: 180,
      align: 'center',
      formatter: 'formatDateTime',
    },
  ];
}
