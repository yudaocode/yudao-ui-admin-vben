import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiKnowledgeDocumentApi } from '#/api/ai/knowledge/document';

import { useAccess } from '@vben/access';
import { CommonStatusEnum } from '@vben/constants';

/** 列表的搜索表单 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'name',
      label: '文件名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入文件名称',
        allowClear: true,
      },
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(
  onStatusChange?: (
    newStatus: number,
    row: AiKnowledgeDocumentApi.KnowledgeDocument,
  ) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions['columns'] {
  const { hasAccessByCodes } = useAccess();
  return [
    {
      field: 'id',
      title: '文档编号',
      minWidth: 100,
    },
    {
      field: 'name',
      title: '文件名称',
      minWidth: 200,
    },
    {
      field: 'contentLength',
      title: '字符数',
      minWidth: 100,
    },
    {
      field: 'tokens',
      title: 'Token 数',
      minWidth: 100,
    },
    {
      field: 'segmentMaxTokens',
      title: '分片最大 Token 数',
      minWidth: 150,
    },
    {
      field: 'retrievalCount',
      title: '召回次数',
      minWidth: 100,
    },
    {
      field: 'status',
      title: '是否启用',
      minWidth: 100,
      align: 'center',
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: 'CellSwitch',
        props: {
          disabled: !hasAccessByCodes(['ai:knowledge:update']),
          checkedValue: CommonStatusEnum.ENABLE,
          unCheckedValue: CommonStatusEnum.DISABLE,
        },
      },
    },
    {
      field: 'createTime',
      title: '上传时间',
      minWidth: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      minWidth: 150,
      fixed: 'right',
      slots: { default: 'actions' },
    },
  ];
}
