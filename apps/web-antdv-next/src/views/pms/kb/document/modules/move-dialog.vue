<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { PmsKnowledgeDocumentApi } from '#/api/pms/kb/content/document';
import type { PmsKnowledgeFolderApi } from '#/api/pms/kb/content/folder';

import { computed, markRaw, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm, z } from '#/adapter/form';
import { moveKnowledgeDocument } from '#/api/pms/kb/content/document';
import {
  getKnowledgeTree,
  moveKnowledgeFolder,
} from '#/api/pms/kb/content/folder';
import KnowledgeLibrarySelect from '#/views/pms/kb/library/components/knowledge-library-select.vue';
import { PmsKnowledgeRootId } from '#/views/pms/kb/utils/constants';
import { canManageKnowledgeContent } from '#/views/pms/kb/utils/permission';

defineOptions({ name: 'PmsKnowledgeContentMoveDialog' });

const emit = defineEmits(['success']);

interface TargetOption {
  children: TargetOption[];
  disabled?: boolean;
  entityId: number;
  folderId: number;
  kind: 'document' | 'folder' | 'root';
  label: string;
  value: string;
}

const contentKind = ref<'document' | 'folder'>('document'); // 内容类型
const contentId = ref(0); // 内容编号
const sourceLibraryId = ref(0); // 源知识库编号
const sourceParentId = ref(0); // 源父文件夹或父文档编号
const sourceFolderId = ref(0); // 源文档所属文件夹编号
const targetLibraryId = ref<number>(); // 目标知识库编号
const targetTree = ref<PmsKnowledgeFolderApi.KnowledgeTree>(); // 目标知识库目录树

// 内容移动目标选项
const targetOptions = computed<TargetOption[]>(() => {
  if (!targetTree.value) {
    return [];
  }
  const root: TargetOption = {
    value: 'root',
    label: '知识库根目录',
    kind: 'root',
    entityId: PmsKnowledgeRootId,
    folderId: PmsKnowledgeRootId,
    disabled: !targetTree.value.manageStatus,
    children: [
      ...targetTree.value.folders.map(buildFolderOption),
      ...(contentKind.value === 'document'
        ? targetTree.value.documents.map((document) =>
            buildDocumentOption(document, 0),
          )
        : []),
    ],
  };
  return [root];
});

const formSchema: VbenFormSchema[] = [
  {
    fieldName: 'contentTitle',
    label: '当前内容',
    component: 'Input',
    componentProps: { disabled: true },
  },
  {
    fieldName: 'targetLibraryId',
    label: '目标知识库',
    component: markRaw(KnowledgeLibrarySelect),
    componentProps: {
      placeholder: '请选择目标知识库',
      onChange(value: number | undefined) {
        targetLibraryId.value = value;
        loadTargetTree();
      },
    },
    rules: z.number({ message: '请选择目标知识库' }),
  },
  {
    fieldName: 'targetKey',
    label: '目标位置',
    component: 'TreeSelect',
    componentProps: () => ({
      class: '!w-full',
      fieldNames: {
        label: 'label',
        value: 'value',
        children: 'children',
      },
      placeholder: '请选择目标位置',
      treeData: targetOptions.value,
      treeDefaultExpandAll: true,
      treeNodeFilterProp: 'label',
    }),
    rules: z.string({ message: '请选择目标位置' }).min(1, '请选择目标位置'),
  },
];

const [Form, formApi] = useVbenForm({
  commonConfig: {
    formItemClass: 'col-span-2',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: formSchema,
  showDefaultActions: false,
});

/** 加载目标目录树 */
async function loadTargetTree() {
  await formApi.setFieldValue('targetKey', undefined);
  if (!targetLibraryId.value) {
    targetTree.value = undefined;
    return;
  }
  modalApi.lock();
  try {
    targetTree.value = await getKnowledgeTree(targetLibraryId.value);
  } finally {
    modalApi.unlock();
  }
}

/** 构建文件夹选项 */
function buildFolderOption(
  folder: PmsKnowledgeFolderApi.KnowledgeFolderTreeNode,
): TargetOption {
  const isSourceOrDescendant =
    contentKind.value === 'folder' &&
    targetLibraryId.value === sourceLibraryId.value &&
    isSourceFolderOrDescendant(folder.id);
  return {
    value: `folder-${folder.id}`,
    label: folder.title,
    kind: 'folder',
    entityId: folder.id,
    folderId: folder.id,
    disabled:
      !canManageKnowledgeContent(folder.currentUserLevel) ||
      isSourceOrDescendant,
    children: [
      ...folder.children.map(buildFolderOption),
      ...(contentKind.value === 'document'
        ? folder.documents.map((document) =>
            buildDocumentOption(document, folder.id),
          )
        : []),
    ],
  };
}

/** 构建文档选项 */
function buildDocumentOption(
  document: PmsKnowledgeDocumentApi.KnowledgeDocumentTreeNode,
  folderId: number,
): TargetOption {
  const isSourceOrDescendant =
    targetLibraryId.value === sourceLibraryId.value &&
    isSourceDocumentOrDescendant(document.id);
  return {
    value: `document-${document.id}`,
    label: document.title,
    kind: 'document',
    entityId: document.id,
    folderId,
    disabled:
      !canManageKnowledgeContent(document.currentUserLevel) ||
      isSourceOrDescendant,
    children: document.children.map((child) =>
      buildDocumentOption(child, folderId),
    ),
  };
}

/** 判断目录树是否包含文件夹 */
function containsFolder(
  folder: PmsKnowledgeFolderApi.KnowledgeFolderTreeNode,
  id: number,
): boolean {
  return (
    folder.id === id ||
    folder.children.some((child) => containsFolder(child, id))
  );
}

/** 查找文件夹 */
function findFolder(
  folders: PmsKnowledgeFolderApi.KnowledgeFolderTreeNode[],
  id: number,
): PmsKnowledgeFolderApi.KnowledgeFolderTreeNode | undefined {
  for (const folder of folders) {
    if (folder.id === id) return folder;
    const child = findFolder(folder.children, id);
    if (child) return child;
  }
  return undefined;
}

/** 判断是否为源文件夹或其子文件夹 */
function isSourceFolderOrDescendant(targetId: number) {
  const sourceFolder = findFolder(
    targetTree.value?.folders || [],
    contentId.value,
  );
  return sourceFolder ? containsFolder(sourceFolder, targetId) : false;
}

/** 判断目录树是否包含文档 */
function containsDocument(
  document: PmsKnowledgeDocumentApi.KnowledgeDocumentTreeNode,
  id: number,
): boolean {
  return (
    document.id === id ||
    document.children.some((child) => containsDocument(child, id))
  );
}

/** 查找文档 */
function findDocument(
  documents: PmsKnowledgeDocumentApi.KnowledgeDocumentTreeNode[],
  id: number,
): PmsKnowledgeDocumentApi.KnowledgeDocumentTreeNode | undefined {
  for (const document of documents) {
    if (document.id === id) return document;
    const child = findDocument(document.children, id);
    if (child) return child;
  }
  return undefined;
}

/** 判断是否为源文档或其子文档 */
function isSourceDocumentOrDescendant(targetId: number) {
  const documents = [
    ...(targetTree.value?.documents || []),
    ...(targetTree.value?.folders.flatMap((folder) =>
      collectFolderDocuments(folder),
    ) || []),
  ];
  const sourceDocument = findDocument(documents, contentId.value);
  return sourceDocument ? containsDocument(sourceDocument, targetId) : false;
}

/** 收集文件夹中的文档 */
function collectFolderDocuments(
  folder: PmsKnowledgeFolderApi.KnowledgeFolderTreeNode,
): PmsKnowledgeDocumentApi.KnowledgeDocumentTreeNode[] {
  return [
    ...folder.documents,
    ...folder.children.flatMap(collectFolderDocuments),
  ];
}

/** 查找目标选项 */
function findTargetOption(
  options: TargetOption[],
  value: string,
): TargetOption | undefined {
  for (const option of options) {
    if (option.value === value) return option;
    const child = findTargetOption(option.children, value);
    if (child) return child;
  }
  return undefined;
}

const [Modal, modalApi] = useVbenModal({
  class: 'w-[560px]',
  async onConfirm() {
    // 1. 校验表单和目标位置
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const values = await formApi.getValues();
    const target = findTargetOption(targetOptions.value, values.targetKey);
    if (!target || !values.targetLibraryId) {
      return;
    }
    if (target.disabled) {
      message.warning('当前账号不能移动到该位置');
      return;
    }
    modalApi.lock();
    try {
      // 2. 根据内容类型发起移动请求
      if (contentKind.value === 'folder') {
        if (
          values.targetLibraryId === sourceLibraryId.value &&
          target.entityId === sourceParentId.value
        ) {
          message.warning('内容已在当前目录');
          return;
        }
        await moveKnowledgeFolder({
          id: contentId.value,
          targetLibraryId: values.targetLibraryId,
          targetParentId: target.entityId,
        });
      } else {
        const targetFolderId =
          target.kind === 'folder' ? target.entityId : target.folderId;
        const targetParentId =
          target.kind === 'document' ? target.entityId : PmsKnowledgeRootId;
        if (
          values.targetLibraryId === sourceLibraryId.value &&
          targetFolderId === sourceFolderId.value &&
          targetParentId === sourceParentId.value
        ) {
          message.warning('内容已在当前目录');
          return;
        }
        await moveKnowledgeDocument({
          id: contentId.value,
          targetLibraryId: values.targetLibraryId,
          targetFolderId,
          targetParentId,
        });
      }
      // 3. 关闭弹窗并通知父组件刷新
      message.success('移动成功');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as {
      content:
        | PmsKnowledgeDocumentApi.KnowledgeDocument
        | PmsKnowledgeFolderApi.KnowledgeFolder;
      kind: 'document' | 'folder';
    };
    // 1. 初始化待移动内容
    contentKind.value = data.kind;
    contentId.value = data.content.id;
    sourceLibraryId.value = data.content.libraryId;
    sourceParentId.value = data.content.parentId;
    sourceFolderId.value =
      data.kind === 'document'
        ? (data.content as PmsKnowledgeDocumentApi.KnowledgeDocument).folderId
        : PmsKnowledgeRootId;

    // 2. 重置目标位置表单
    targetLibraryId.value = data.content.libraryId;
    await formApi.setValues({
      contentTitle: data.content.title,
      targetLibraryId: data.content.libraryId,
      targetKey: undefined,
    });

    // 3. 加载目标知识库目录树
    await loadTargetTree();
  },
});
</script>

<template>
  <Modal :title="`移动${contentKind === 'folder' ? '文件夹' : '文档'}`">
    <Form class="mx-4" />
  </Modal>
</template>
