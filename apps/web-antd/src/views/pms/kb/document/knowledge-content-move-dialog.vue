<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { PmsKnowledgeDocumentApi } from '#/api/pms/kb/content/document';
import type { PmsKnowledgeFolderApi } from '#/api/pms/kb/content/folder';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, Input, message, TreeSelect } from 'ant-design-vue';

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

// 定义 success 事件，用于操作成功后的回调 TODO 这个注释？需要删除，还是保留噢？

const loading = ref(false); // 数据加载和提交中
const contentKind = ref<'document' | 'folder'>('document'); // 内容类型
const contentId = ref(0); // 内容编号
const contentTitle = ref(''); // 内容标题
const sourceLibraryId = ref(0); // 源知识库编号
const sourceParentId = ref(0); // 源父文件夹或父文档编号
const sourceFolderId = ref(0); // 源文档所属文件夹编号
const targetTree = ref<PmsKnowledgeFolderApi.KnowledgeTree>(); // 目标知识库目录树
const formData = reactive({
  targetLibraryId: undefined as number | undefined,
  targetKey: '',
}); // 表单数据
const formRules: Record<string, Rule[]> = {
  targetLibraryId: [{ required: true, message: '请选择目标知识库' }],
  targetKey: [{ required: true, message: '请选择目标位置' }],
}; // 表单校验规则
const formRef = ref(); // 表单 Ref

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

/** 加载目标目录树 */
async function loadTargetTree() {
  formData.targetKey = '';
  if (!formData.targetLibraryId) {
    targetTree.value = undefined;
    return;
  }
  targetTree.value = await getKnowledgeTree(formData.targetLibraryId);
}

/** 构建文件夹选项 */
function buildFolderOption(
  folder: PmsKnowledgeFolderApi.KnowledgeFolderTreeNode,
): TargetOption {
  const isSourceOrDescendant =
    contentKind.value === 'folder' &&
    formData.targetLibraryId === sourceLibraryId.value &&
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
    formData.targetLibraryId === sourceLibraryId.value &&
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
    // 1.1 校验表单
    if (
      !formRef.value ||
      !(await formRef.value.validate().catch(() => false))
    ) {
      return;
    }
    const target = findTargetOption(targetOptions.value, formData.targetKey);
    if (!target || !formData.targetLibraryId) {
      return;
    }
    // 1.2 校验目标位置可编辑
    if (target.disabled) {
      message.warning('当前账号不能移动到该位置');
      return;
    }
    loading.value = true;
    try {
      // 3. 根据内容类型发起移动请求
      if (contentKind.value === 'folder') {
        if (
          formData.targetLibraryId === sourceLibraryId.value &&
          target.entityId === sourceParentId.value
        ) {
          message.warning('内容已在当前目录');
          return;
        }
        await moveKnowledgeFolder({
          id: contentId.value,
          targetLibraryId: formData.targetLibraryId,
          targetParentId: target.entityId,
        });
      } else {
        const targetFolderId =
          target.kind === 'folder' ? target.entityId : target.folderId;
        const targetParentId =
          target.kind === 'document' ? target.entityId : PmsKnowledgeRootId;
        if (
          formData.targetLibraryId === sourceLibraryId.value &&
          targetFolderId === sourceFolderId.value &&
          targetParentId === sourceParentId.value
        ) {
          message.warning('内容已在当前目录');
          return;
        }
        await moveKnowledgeDocument({
          id: contentId.value,
          targetLibraryId: formData.targetLibraryId,
          targetFolderId,
          targetParentId,
        });
      }
      // 3. 关闭弹窗并通知父组件刷新
      message.success('移动成功');
      await modalApi.close();
      emit('success');
    } finally {
      loading.value = false;
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
    contentTitle.value = data.content.title;
    sourceLibraryId.value = data.content.libraryId;
    sourceParentId.value = data.content.parentId;
    sourceFolderId.value =
      data.kind === 'document'
        ? (data.content as PmsKnowledgeDocumentApi.KnowledgeDocument).folderId
        : PmsKnowledgeRootId;

    // 2. 重置目标位置表单
    formData.targetLibraryId = data.content.libraryId;
    formData.targetKey = '';
    formRef.value?.resetFields();

    // 3. 加载目标知识库目录树
    loading.value = true;
    try {
      await loadTargetTree();
    } finally {
      loading.value = false;
    }
  },
});

/** 打开弹窗 */
defineExpose({
  open: (
    kind: 'document' | 'folder',
    content:
      | PmsKnowledgeDocumentApi.KnowledgeDocument
      | PmsKnowledgeFolderApi.KnowledgeFolder,
  ) => {
    modalApi.setData({ kind, content }).open();
  },
});
</script>

<template>
  <Modal :title="`移动${contentKind === 'folder' ? '文件夹' : '文档'}`">
    <Form
      ref="formRef"
      v-loading="loading"
      :label-col="{ style: { width: '100px' } }"
      :model="formData"
      :rules="formRules"
    >
      <Form.Item label="当前内容">
        <Input :value="contentTitle" disabled />
      </Form.Item>
      <Form.Item label="目标知识库" name="targetLibraryId">
        <KnowledgeLibrarySelect
          v-model="formData.targetLibraryId"
          placeholder="请选择目标知识库"
          @change="loadTargetTree"
        />
      </Form.Item>
      <Form.Item label="目标位置" name="targetKey">
        <TreeSelect
          v-model:value="formData.targetKey"
          :field-names="{
            label: 'label',
            value: 'value',
            children: 'children',
          }"
          :tree-data="targetOptions"
          tree-node-filter-prop="label"
          class="!w-full"
          placeholder="请选择目标位置"
          tree-default-expand-all
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
