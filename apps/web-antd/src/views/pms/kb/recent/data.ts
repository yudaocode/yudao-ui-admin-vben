import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeInteractionApi } from '#/api/pms/kb/interaction/types';

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PmsKnowledgeInteractionApi.KnowledgeInteractionItem>['columns'] {
  return [
    {
      field: 'name',
      title: '名称',
      width: 260,
      slots: { default: 'name' },
    },
    {
      field: 'type',
      title: '类型',
      width: 100,
      slots: { default: 'type' },
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
      slots: { default: 'createTime' },
    },
  ];
}
