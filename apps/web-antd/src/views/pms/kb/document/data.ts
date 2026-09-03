import type { KnowledgeTreeNode } from './types';

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeRecycleApi } from '#/api/pms/kb/recycle';

import { markRaw } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { z } from '#/adapter/form';
import {
  PmsKnowledgeContentLevel,
  PmsKnowledgeObjectType,
  PmsKnowledgeUploadFileSize,
  PmsKnowledgeUploadFileTypes,
} from '#/views/pms/kb/utils/constants';

import KnowledgeDocumentLabelSelect from './components/knowledge-document-label-select.vue';
import { getKnowledgeTreeNodeTypeName } from './types';

/** 列表的字段 */
export function useGridColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'identityType',
      title: '类型',
      width: 100,
      slots: { default: 'identityType' },
    },
    {
      field: 'member',
      title: '协作者',
      width: 250,
      slots: { default: 'member' },
    },
    {
      field: 'level',
      title: '权限',
      width: 170,
      slots: { default: 'level' },
    },
    {
      align: 'center',
      title: '操作',
      width: 80,
      slots: { default: 'action' },
    },
  ];
}

/** 知识库主页列表的字段 */
export function useLibraryHomeGridColumns(): VxeTableGridOptions<KnowledgeTreeNode>['columns'] {
  return [
    {
      field: 'label',
      title: '',
      minWidth: 240,
      align: 'left',
      slots: { default: 'label' },
    },
    {
      field: 'type',
      title: '',
      width: 100,
      align: 'right',
      className: 'text-xs text-muted-foreground',
      formatter: ({ row }) => getKnowledgeTreeNodeTypeName(row),
    },
  ];
}

/** 文件夹内容列表的字段 */
export function useFolderContentGridColumns(): VxeTableGridOptions<KnowledgeTreeNode>['columns'] {
  return [
    {
      field: 'label',
      title: '名称',
      minWidth: 240,
      align: 'left',
      slots: { default: 'label' },
    },
    {
      field: 'type',
      title: '类型',
      width: 100,
      align: 'right',
      className: 'text-xs text-muted-foreground',
      formatter: ({ row }) => getKnowledgeTreeNodeTypeName(row),
    },
  ];
}

/** 回收站列表的字段 */
export function useRecycleGridColumns(
  activeType: number,
): VxeTableGridOptions<PmsKnowledgeRecycleApi.KnowledgeRecycle>['columns'] {
  return [
    {
      field: 'name',
      title: '名称',
      minWidth: 240,
      slots: { default: 'name' },
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
    // 大小列仅文件类型展示
    ...(activeType === PmsKnowledgeObjectType.FILE
      ? [
          {
            field: 'fileSize',
            title: '大小',
            width: 120,
            slots: { default: 'fileSize' },
          },
        ]
      : []),
    {
      field: 'deleteTime',
      title: '删除时间',
      width: 180,
      formatter: 'formatDateTime',
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

/** 新建文档的表单 */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入文档名称',
      },
      fieldName: 'title',
      label: '文档名称',
      rules: 'required',
    },
  ];
}

/** 新增/修改文件夹的表单 */
export function useFolderFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'libraryId',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'parentId',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入文件夹名称',
      },
      fieldName: 'title',
      label: '文件夹名称',
      rules: 'required',
    },
  ];
}

/** 协作权限的表单 */
export function usePermissionFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '知识库内公开', value: true },
          { label: '仅协作者可见', value: false },
        ],
        optionType: 'button',
      },
      defaultValue: true,
      fieldName: 'openStatus',
      label: '访问范围',
    },
    {
      component: 'Select',
      componentProps: {
        class: '!w-[280px]',
        options: getDictOptions(
          DICT_TYPE.PMS_KNOWLEDGE_CONTENT_LEVEL,
          'number',
        ),
      },
      defaultValue: PmsKnowledgeContentLevel.PREVIEW as number,
      dependencies: {
        triggerFields: ['openStatus'],
        show: (values) => !!values.openStatus,
      },
      fieldName: 'openLevel',
      label: '公开权限',
    },
  ];
}

/** 编辑文档的表单 */
export function useUpdateFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'type',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'fileType',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'fileSize',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '请输入文档标题',
      },
      fieldName: 'title',
      hideLabel: true,
    },
    {
      component: markRaw(KnowledgeDocumentLabelSelect),
      fieldName: 'labelIds',
      label: '标签',
    },
    {
      component: 'Input',
      fieldName: 'content',
      formItemClass: '!pb-0',
      hideLabel: true,
      rules: z.string({ message: '请输入文档内容' }).min(1, '请输入文档内容'),
    },
  ];
}

/** 上传文件的表单 */
export function useUploadFormSchema(options: {
  onFileChange: (value: string) => void;
  onFileSizeChange: (value?: number) => void;
}): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'libraryId',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'folderId',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'parentId',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'type',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'fileType',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Input',
      fieldName: 'fileSize',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'FileUpload',
      componentProps: {
        accept: [...PmsKnowledgeUploadFileTypes],
        maxNumber: 1,
        maxSize: PmsKnowledgeUploadFileSize,
        showDescription: true,
        onChange: options.onFileChange,
        'onUpdate:fileSize': options.onFileSizeChange,
      },
      fieldName: 'content',
      label: '文件',
      rules: z.string({ message: '请上传文件' }).min(1, '请上传文件'),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: '上传后自动填充，可修改',
      },
      fieldName: 'title',
      label: '文件名称',
      rules: 'required',
    },
  ];
}
