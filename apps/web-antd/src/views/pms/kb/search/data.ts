import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeDocumentApi } from '#/api/pms/kb/content/document';

import { markRaw } from 'vue';

import { getRangePickerDefaultProps } from '#/utils';
import KnowledgeLibrarySelect from '#/views/pms/kb/library/components/knowledge-library-select.vue';
import { UserSelect } from '#/views/system/user/components';

/** 列表的搜索表单 */
export function useGridFormSchema(
  defaultValues: Record<string, any>,
): VbenFormSchema[] {
  return [
    {
      fieldName: 'keyword',
      label: '关键字',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '请输入文档标题或正文',
      },
      defaultValue: defaultValues.keyword,
    },
    {
      fieldName: 'libraryId',
      label: '知识库',
      component: markRaw(KnowledgeLibrarySelect),
      componentProps: {
        placeholder: '请选择知识库',
      },
      defaultValue: defaultValues.libraryId,
    },
    {
      fieldName: 'creatorUserId',
      label: '创建人',
      component: markRaw(UserSelect),
      componentProps: {
        placeholder: '请选择创建人',
      },
      defaultValue: defaultValues.creatorUserId,
    },
    {
      fieldName: 'updateTime',
      label: '更新时间',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        allowClear: true,
      },
      defaultValue: defaultValues.updateTime,
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PmsKnowledgeDocumentApi.KnowledgeDocument>['columns'] {
  return [
    {
      field: 'title',
      title: '文档标题',
      width: 280,
      slots: { default: 'title' },
    },
    {
      field: 'libraryName',
      title: '知识库',
      width: 180,
    },
    {
      field: 'type',
      title: '类型',
      width: 130,
      align: 'center',
      slots: { default: 'type' },
    },
    {
      field: 'creatorUserName',
      title: '创建人',
      width: 130,
    },
    {
      field: 'updateTime',
      title: '更新时间',
      width: 180,
      align: 'center',
      slots: { default: 'updateTime' },
    },
  ];
}
