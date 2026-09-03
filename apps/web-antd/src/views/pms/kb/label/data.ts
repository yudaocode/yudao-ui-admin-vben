import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeDocumentApi } from '#/api/pms/kb/content/document';
import type { PmsKnowledgeDocumentLabelApi } from '#/api/pms/kb/content/document/label';

import { markRaw } from 'vue';

import { ColorPicker } from '#/components/color-picker';

/** 新增/编辑文档标签的表单 */
export function useLabelFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入标签名称',
      },
      fieldName: 'name',
      label: '标签名称',
      rules: 'required',
    },
    {
      component: markRaw(ColorPicker),
      defaultValue: '#409EFF',
      fieldName: 'color',
      label: '标签颜色',
      rules: 'required',
    },
  ];
}

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions<PmsKnowledgeDocumentApi.KnowledgeDocument>['columns'] {
  return [
    {
      field: 'title',
      title: '文档标题',
      width: 240,
      slots: { default: 'title' },
    },
    {
      field: 'libraryName',
      title: '知识库',
      width: 180,
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

/** 标签管理列表的字段 */
export function useLabelManageGridColumns(): VxeTableGridOptions<PmsKnowledgeDocumentLabelApi.KnowledgeDocumentLabel>['columns'] {
  return [
    {
      field: 'name',
      title: '标签',
      width: 220,
      slots: { default: 'name' },
    },
    {
      field: 'color',
      title: '颜色',
      width: 140,
      align: 'center',
    },
    {
      title: '操作',
      width: 160,
      align: 'center',
      slots: { default: 'actions' },
    },
  ];
}
