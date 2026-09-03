import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeInteractionApi } from '#/api/pms/kb/interaction/types';

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PmsKnowledgeInteractionApi.KnowledgeInteractionItem>['columns'] {
  return [
    {
      field: 'name',
      title: '名称',
      width: 260,
      align: 'left',
      slots: { default: 'name' },
    },
    {
      field: 'type',
      title: '类型',
      width: 100,
      align: 'left',
      slots: { default: 'type' },
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
      slots: { default: 'targetUpdateTime' },
    },
    {
      field: 'createTime',
      title: '关注时间',
      width: 180,
      slots: { default: 'createTime' },
    },
    {
      title: '是否关注',
      width: 100,
      fixed: 'right',
      slots: { default: 'favorite' },
    },
  ];
}
