<script lang="ts" setup>
import type { KnowledgeContentView, KnowledgeTreeNode } from './types';

import type { PmsKnowledgeDocumentApi } from '#/api/pms/kb/content/document';
import type { PmsKnowledgeFolderApi } from '#/api/pms/kb/content/folder';
import type { PmsKnowledgeInteractionApi } from '#/api/pms/kb/interaction/types';
import type { PmsKnowledgeLibraryApi } from '#/api/pms/kb/library';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  confirm,
  DocAlert,
  Page,
  Spinner,
  useVbenModal,
} from '@vben/common-ui';

import { message } from 'antdv-next';

import {
  deleteKnowledgeDocument,
  getKnowledgeDocument,
} from '#/api/pms/kb/content/document';
import { getKnowledgeDocumentLabelList } from '#/api/pms/kb/content/document/label';
import {
  deleteKnowledgeFolder,
  getKnowledgeFolder,
  getKnowledgeTree,
} from '#/api/pms/kb/content/folder';
import {
  createKnowledgeFavorite,
  deleteKnowledgeFavorite,
  getKnowledgeFavoriteList,
} from '#/api/pms/kb/interaction/favorite';
import {
  createKnowledgeDocumentLike,
  deleteKnowledgeDocumentLike,
} from '#/api/pms/kb/interaction/like';
import { getKnowledgeLibrary } from '#/api/pms/kb/library';
import { exitKnowledgeLibrary } from '#/api/pms/kb/library/member';
import {
  PmsKnowledgeObjectType,
  PmsKnowledgeRootId,
} from '#/views/pms/kb/utils/constants';
import { canEditKnowledgeContent } from '#/views/pms/kb/utils/permission';

import KnowledgeMemberForm from '../library/modules/member-form.vue';
import KnowledgeDocumentDetail from './knowledge-document-detail.vue';
import KnowledgeFolderDetail from './knowledge-folder-detail.vue';
import KnowledgeLibraryHome from './knowledge-library-home.vue';
import KnowledgeLibrarySidebar from './knowledge-library-sidebar.vue';
import KnowledgeRecyclePanel from './knowledge-recycle-panel.vue';
import KnowledgeDocumentCreateForm from './modules/create-form.vue';
import KnowledgeFolderForm from './modules/folder-form.vue';
import KnowledgeContentMoveDialog from './modules/move-dialog.vue';
import KnowledgeContentPermissionForm from './modules/permission-form.vue';
import KnowledgeDocumentShareDialog from './modules/share-dialog.vue';
import KnowledgeDocumentUpdateForm from './modules/update-form.vue';
import KnowledgeFileUploadForm from './modules/upload-form.vue';

defineOptions({ name: 'PmsKnowledgeLibraryDetail' });

const route = useRoute(); // 当前路由
const router = useRouter(); // 路由
const libraryId = computed(() => Number(route.params.libraryId)); // 知识库编号
const loading = ref(false); // 页面加载中
const activeView = ref<KnowledgeContentView>('home'); // 当前右侧内容
const library = ref<PmsKnowledgeLibraryApi.KnowledgeLibrary>(); // 知识库详情
const tree = ref<PmsKnowledgeFolderApi.KnowledgeTree>(); // 目录树
const selectedFolder = ref<PmsKnowledgeFolderApi.KnowledgeFolder>(); // 当前文件夹
const selectedDocument = ref<PmsKnowledgeDocumentApi.KnowledgeDocument>(); // 当前文档
const labelList = ref<any[]>([]); // 文档标签列表
const favoriteItems = ref<
  PmsKnowledgeInteractionApi.KnowledgeInteractionItem[]
>([]); // 当前知识库关注内容
const favoriteLoading = ref(false); // 关注内容加载中
const favoriteTabActive = ref(false); // 是否正在查看关注页签

const [KnowledgeFolderFormModal, knowledgeFolderFormModalApi] = useVbenModal({
  connectedComponent: KnowledgeFolderForm,
  destroyOnClose: true,
});
const [KnowledgeDocumentCreateFormModal, knowledgeDocumentCreateFormModalApi] =
  useVbenModal({
    connectedComponent: KnowledgeDocumentCreateForm,
    destroyOnClose: true,
  });
const [KnowledgeFileUploadFormModal, knowledgeFileUploadFormModalApi] =
  useVbenModal({
    connectedComponent: KnowledgeFileUploadForm,
    destroyOnClose: true,
  });
const [KnowledgeDocumentUpdateFormModal, knowledgeDocumentUpdateFormModalApi] =
  useVbenModal({
    connectedComponent: KnowledgeDocumentUpdateForm,
    destroyOnClose: true,
  });
const [KnowledgeMemberFormModal, knowledgeMemberFormModalApi] = useVbenModal({
  connectedComponent: KnowledgeMemberForm,
  destroyOnClose: true,
});
const [
  KnowledgeDocumentShareDialogModal,
  knowledgeDocumentShareDialogModalApi,
] = useVbenModal({
  connectedComponent: KnowledgeDocumentShareDialog,
  destroyOnClose: true,
});
const [
  KnowledgeContentPermissionFormModal,
  knowledgeContentPermissionFormModalApi,
] = useVbenModal({
  connectedComponent: KnowledgeContentPermissionForm,
  destroyOnClose: true,
});
const [KnowledgeContentMoveDialogModal, knowledgeContentMoveDialogModalApi] =
  useVbenModal({
    connectedComponent: KnowledgeContentMoveDialog,
    destroyOnClose: true,
  });

const treeData = computed<KnowledgeTreeNode[]>(() => {
  if (!tree.value) {
    return [];
  }
  return [
    ...tree.value.folders.map(buildFolderNode),
    ...tree.value.documents.map(buildDocumentNode),
  ];
}); // 目录树节点
const currentNodeKey = computed(() => {
  if (activeView.value === 'folder') {
    return `folder-${selectedFolder.value?.id}`;
  }
  if (activeView.value === 'document') {
    return `document-${selectedDocument.value?.id}`;
  }
  return undefined;
}); // 当前目录节点标识
const selectedDocumentLabels = computed(() => {
  const labelIds = new Set(selectedDocument.value?.labelIds);
  return labelList.value.filter((label) => labelIds.has(label.id));
}); // 当前文档标签
const selectedFolderChildren = computed(() => {
  if (!selectedFolder.value) {
    return [];
  }
  return (
    findTreeNode(treeData.value, `folder-${selectedFolder.value.id}`)
      ?.children ?? []
  );
}); // 当前文件夹的直属内容
const canCreateFolder = computed(
  () =>
    Boolean(tree.value?.writeStatus) ||
    canEditKnowledgeContent(selectedFolder.value?.currentUserLevel),
); // 是否可新建文件夹
const canCreateDocument = computed(
  () =>
    Boolean(tree.value?.writeStatus) ||
    canEditKnowledgeContent(selectedFolder.value?.currentUserLevel) ||
    canEditKnowledgeContent(selectedDocument.value?.currentUserLevel),
); // 是否可新建文档

/** 查询知识库页面数据 */
async function getPageData() {
  loading.value = true;
  try {
    // 并行加载页面所需数据
    const [libraryData, treeDataValue, fetchedLabels] = await Promise.all([
      getKnowledgeLibrary(libraryId.value),
      getKnowledgeTree(libraryId.value),
      getKnowledgeDocumentLabelList(),
    ]);
    library.value = libraryData;
    tree.value = treeDataValue;
    labelList.value = fetchedLabels;
    favoriteItems.value = [];
    favoriteTabActive.value = false;
    // 根据当前路由加载主页、文件夹或文档详情
    await getRouteContent();
  } finally {
    loading.value = false;
  }
}

/** 根据路由加载知识库内容 */
async function getRouteContent() {
  // 切换知识库时，由页面数据查询统一加载内容
  if (library.value?.id !== libraryId.value) {
    return;
  }
  // 打开指定文档
  const documentId = Number(route.query.documentId);
  if (Number.isFinite(documentId) && documentId > 0) {
    selectedDocument.value = await getKnowledgeDocument(documentId, true);
    selectedFolder.value = undefined;
    activeView.value = 'document';
    return;
  }
  // 打开指定文件夹
  const folderId = Number(route.query.folderId);
  if (Number.isFinite(folderId) && folderId > 0) {
    selectedFolder.value = await getKnowledgeFolder(folderId, true);
    selectedDocument.value = undefined;
    activeView.value = 'folder';
    return;
  }
  // 默认打开知识库主页
  activeView.value = 'home';
  selectedFolder.value = undefined;
  selectedDocument.value = undefined;
}

/** 查询目录树 */
async function getTree() {
  tree.value = await getKnowledgeTree(libraryId.value);
}

/** 查询当前知识库的关注内容 */
async function getFavoriteItems() {
  favoriteLoading.value = true;
  try {
    favoriteItems.value = await getKnowledgeFavoriteList(libraryId.value);
  } finally {
    favoriteLoading.value = false;
  }
}

/** 切换知识库主页内容页签 */
async function handleLibraryTabChange(tab: 'all' | 'favorite') {
  favoriteTabActive.value = tab === 'favorite';
  if (favoriteTabActive.value) {
    await getFavoriteItems();
  }
}

/** 构建文件夹树节点 */
function buildFolderNode(
  folder: PmsKnowledgeFolderApi.KnowledgeFolderTreeNode,
): KnowledgeTreeNode {
  return {
    key: `folder-${folder.id}`,
    entityId: folder.id,
    kind: 'folder',
    label: folder.title,
    currentUserLevel: folder.currentUserLevel,
    children: [
      ...folder.children.map(buildFolderNode),
      ...folder.documents.map(buildDocumentNode),
    ],
  };
}

/** 构建文档树节点 */
function buildDocumentNode(
  document: PmsKnowledgeDocumentApi.KnowledgeDocumentTreeNode,
): KnowledgeTreeNode {
  return {
    key: `document-${document.id}`,
    entityId: document.id,
    kind: 'document',
    label: document.title,
    currentUserLevel: document.currentUserLevel,
    type: document.type,
    children: document.children.map(buildDocumentNode),
  };
}

/** 打开目录节点 */
async function handleNodeClick(node: KnowledgeTreeNode) {
  const query =
    node.kind === 'folder'
      ? { folderId: String(node.entityId) }
      : { documentId: String(node.entityId) };
  await router.replace({ path: `/pms/kb/library/${libraryId.value}`, query });
}

/** 处理目录树节点快捷操作 */
async function handleNodeAction(node: KnowledgeTreeNode, command: string) {
  if (
    command === 'create-document' ||
    command === 'create-folder' ||
    command === 'upload'
  ) {
    if (command === 'create-document') {
      knowledgeDocumentCreateFormModalApi
        .setData({
          libraryId: libraryId.value,
          folderId: node.entityId,
          parentId: PmsKnowledgeRootId,
        })
        .open();
    } else if (command === 'create-folder') {
      knowledgeFolderFormModalApi
        .setData({
          formType: 'create',
          libraryId: libraryId.value,
          parentId: node.entityId,
        })
        .open();
    } else {
      knowledgeFileUploadFormModalApi
        .setData({
          libraryId: libraryId.value,
          folderId: node.entityId,
          parentId: PmsKnowledgeRootId,
        })
        .open();
    }
    return;
  }
  if (node.kind === 'folder') {
    const folder = await getKnowledgeFolder(node.entityId);
    if (command === 'rename') {
      knowledgeFolderFormModalApi
        .setData({
          formType: 'update',
          libraryId: libraryId.value,
          parentId: folder.parentId,
          id: folder.id,
        })
        .open();
    } else if (command === 'move') {
      knowledgeContentMoveDialogModalApi
        .setData({ kind: 'folder', content: folder })
        .open();
    } else if (command === 'delete') {
      await deleteFolder(folder);
    }
    return;
  }
  const document = await getKnowledgeDocument(node.entityId);
  if (command === 'rename') {
    knowledgeDocumentUpdateFormModalApi.setData({ id: document.id }).open();
  } else if (command === 'move') {
    knowledgeContentMoveDialogModalApi
      .setData({ kind: 'document', content: document })
      .open();
  } else if (command === 'delete') {
    await deleteDocument(document);
  }
}

/** 删除文件夹并刷新目录树 */
async function deleteFolder(folder: PmsKnowledgeFolderApi.KnowledgeFolder) {
  try {
    await confirm(`确认删除文件夹“${folder.title}”吗？`);
    await deleteKnowledgeFolder(folder.id);
    message.success('删除成功');
    await getTree();
  } catch {}
}

/** 删除文档并刷新目录树 */
async function deleteDocument(
  document: PmsKnowledgeDocumentApi.KnowledgeDocument,
) {
  try {
    await confirm(`确认删除文档“${document.title}”吗？`);
    await deleteKnowledgeDocument(document.id);
    message.success('删除成功');
    await getTree();
  } catch {}
}

/** 从知识库主页进入限定当前知识库的搜索 */
function handleLibrarySearch() {
  router.push({
    path: '/pms/kb/search',
    query: { libraryId: String(libraryId.value) },
  });
}

/** 打开知识库主页 */
async function handleHome() {
  activeView.value = 'home';
  selectedFolder.value = undefined;
  selectedDocument.value = undefined;
  await router.replace({ path: `/pms/kb/library/${libraryId.value}` });
  if (favoriteTabActive.value) {
    await getFavoriteItems();
  }
}

/** 打开最近删除 */
function handleRecycle() {
  activeView.value = 'recycle';
  selectedFolder.value = undefined;
  selectedDocument.value = undefined;
}

/** 处理目录新建命令 */
function handleCreateCommand(command: 'document' | 'folder' | 'upload') {
  if (command === 'folder') {
    openFolderForm('create');
    return;
  }
  if (command === 'upload') {
    openFileUploadForm();
    return;
  }
  openDocumentCreateForm();
}

/** 打开文件夹表单 */
function openFolderForm(formType: 'create' | 'update') {
  knowledgeFolderFormModalApi
    .setData({
      formType,
      libraryId: libraryId.value,
      parentId:
        formType === 'create'
          ? selectedFolder.value?.id || PmsKnowledgeRootId
          : PmsKnowledgeRootId,
      id: formType === 'update' ? selectedFolder.value?.id : undefined,
    })
    .open();
}

/** 打开文档新增表单 */
function openDocumentCreateForm() {
  knowledgeDocumentCreateFormModalApi
    .setData({
      libraryId: libraryId.value,
      folderId: selectedFolder.value?.id || PmsKnowledgeRootId,
      parentId: selectedDocument.value?.id || PmsKnowledgeRootId,
    })
    .open();
}

/** 打开文件上传表单 */
function openFileUploadForm() {
  knowledgeFileUploadFormModalApi
    .setData({
      libraryId: libraryId.value,
      folderId: selectedFolder.value?.id || PmsKnowledgeRootId,
      parentId: selectedDocument.value?.id || PmsKnowledgeRootId,
    })
    .open();
}

/** 打开文档编辑表单 */
function openDocumentUpdateForm() {
  if (!selectedDocument.value) {
    return;
  }
  knowledgeDocumentUpdateFormModalApi
    .setData({ id: selectedDocument.value.id })
    .open();
}

/** 处理内容删除成功 */
async function handleContentDeleted() {
  await handleHome();
  await getTree();
}

/** 关注或取消关注知识库 */
async function handleLibraryCollect() {
  if (!library.value) {
    return;
  }
  library.value.favoriteStatus = await toggleFavorite(
    PmsKnowledgeObjectType.LIBRARY,
    library.value.id,
    Boolean(library.value.favoriteStatus),
  );
}

/** 关注或取消关注文件夹 */
async function handleFolderCollect() {
  if (!selectedFolder.value) {
    return;
  }
  selectedFolder.value.favoriteStatus = await toggleFavorite(
    PmsKnowledgeObjectType.FOLDER,
    selectedFolder.value.id,
    selectedFolder.value.favoriteStatus,
  );
}

/** 关注或取消关注文档 */
async function handleDocumentCollect() {
  if (!selectedDocument.value) {
    return;
  }
  selectedDocument.value.favoriteStatus = await toggleFavorite(
    selectedDocument.value.type,
    selectedDocument.value.id,
    selectedDocument.value.favoriteStatus,
  );
}

/** 切换关注状态 */
async function toggleFavorite(
  type: number,
  entityId: number,
  favoriteStatus: boolean,
) {
  if (favoriteStatus) {
    await deleteKnowledgeFavorite(type, entityId);
    message.success('已取消关注');
    return false;
  }
  await createKnowledgeFavorite({ type, entityId });
  message.success('关注成功');
  return true;
}

/** 点赞或取消点赞文档 */
async function handleDocumentLike() {
  if (!selectedDocument.value) {
    return;
  }
  await (selectedDocument.value.likeStatus
    ? deleteKnowledgeDocumentLike(selectedDocument.value.id)
    : createKnowledgeDocumentLike(selectedDocument.value.id));
  selectedDocument.value = await getKnowledgeDocument(
    selectedDocument.value.id,
  );
}

/** 退出知识库 */
async function handleExitLibrary() {
  try {
    // 退出的二次确认
    await confirm(
      `确认退出知识库“${library.value?.name}”吗？退出后将无法访问私有内容。`,
    );
    // 发起退出
    await exitKnowledgeLibrary(libraryId.value);
    message.success('已退出知识库');
    await router.push('/pms/kb/library');
  } catch {}
}

/** 内容变化后刷新目录与选中内容 */
async function handleContentChanged() {
  await getTree();
  if (selectedDocument.value) {
    selectedDocument.value = await getKnowledgeDocument(
      selectedDocument.value.id,
    );
  } else if (selectedFolder.value) {
    selectedFolder.value = await getKnowledgeFolder(selectedFolder.value.id);
  }
}

/** 最近删除变化后刷新目录 */
async function handleRecycleChanged() {
  await getTree();
}

/** 内容移动后返回主页并刷新目录 */
async function handleMoveChanged() {
  await handleHome();
  await getTree();
}

/** 按节点标识查找目录树节点 */
function findTreeNode(
  nodes: KnowledgeTreeNode[],
  key: string,
): KnowledgeTreeNode | undefined {
  for (const node of nodes) {
    if (node.key === key) return node;
    const child = findTreeNode(node.children, key);
    if (child) return child;
  }
  return undefined;
}

/** 初始化 */
onMounted(() => {
  getPageData();
});

watch(libraryId, () => {
  getPageData();
});
watch([() => route.query.folderId, () => route.query.documentId], () => {
  getRouteContent();
});
</script>

<template>
  <!-- 知识库工作区 -->
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【PMS】文档与协作"
        url="https://doc.iocoder.cn/pms/kb/document/"
      />
    </template>

    <Spinner
      :spinning="loading"
      class="knowledge-library-workspace grid min-h-[calc(100vh-120px)] grid-cols-[240px_minmax(0,1fr)] gap-4 max-[900px]:grid-cols-1"
    >
      <!-- 左侧导航与目录 -->
      <div class="rounded-lg bg-background !p-0">
        <KnowledgeLibrarySidebar
          :active-view="activeView"
          :can-create-document="canCreateDocument"
          :can-create-folder="canCreateFolder"
          :current-node-key="currentNodeKey"
          :tree-data="treeData"
          :write-status="Boolean(tree?.writeStatus)"
          @create="handleCreateCommand"
          @home="handleHome"
          @node-click="handleNodeClick"
          @node-action="handleNodeAction"
          @recycle="handleRecycle"
        />
      </div>

      <!-- 右侧业务内容 -->
      <div class="knowledge-library-main rounded-lg bg-background px-8 py-6">
        <KnowledgeRecyclePanel
          v-if="activeView === 'recycle'"
          :library-id="libraryId"
          @success="handleRecycleChanged"
        />
        <KnowledgeDocumentDetail
          v-else-if="activeView === 'document' && selectedDocument"
          :document="selectedDocument"
          :labels="selectedDocumentLabels"
          @collect="handleDocumentCollect"
          @delete="handleContentDeleted"
          @like="handleDocumentLike"
          @move="
            knowledgeContentMoveDialogModalApi
              .setData({ kind: 'document', content: selectedDocument })
              .open()
          "
          @permission="
            knowledgeContentPermissionFormModalApi
              .setData({ id: selectedDocument.permissionId })
              .open()
          "
          @share="
            knowledgeDocumentShareDialogModalApi
              .setData({ id: selectedDocument.id })
              .open()
          "
          @update="openDocumentUpdateForm"
        />
        <KnowledgeFolderDetail
          v-else-if="activeView === 'folder' && selectedFolder"
          :children="selectedFolderChildren"
          :folder="selectedFolder"
          @collect="handleFolderCollect"
          @delete="handleContentDeleted"
          @move="
            knowledgeContentMoveDialogModalApi
              .setData({ kind: 'folder', content: selectedFolder })
              .open()
          "
          @node-click="handleNodeClick"
          @permission="
            knowledgeContentPermissionFormModalApi
              .setData({ id: selectedFolder.permissionId })
              .open()
          "
          @update="openFolderForm('update')"
        />
        <KnowledgeLibraryHome
          v-else
          :key="libraryId"
          :favorite-items="favoriteItems"
          :favorite-loading="favoriteLoading"
          :library="library"
          :tree-data="treeData"
          :write-status="Boolean(tree?.writeStatus)"
          @collect="handleLibraryCollect"
          @exit="handleExitLibrary"
          @member="
            knowledgeMemberFormModalApi.setData({ id: libraryId }).open()
          "
          @node-click="handleNodeClick"
          @search="handleLibrarySearch"
          @tab-change="handleLibraryTabChange"
        />
      </div>
    </Spinner>

    <!-- 内容管理弹窗 -->
    <KnowledgeFolderFormModal @success="handleContentChanged" />
    <KnowledgeDocumentCreateFormModal @success="handleContentChanged" />
    <KnowledgeFileUploadFormModal @success="handleContentChanged" />
    <KnowledgeDocumentUpdateFormModal @success="handleContentChanged" />
    <KnowledgeMemberFormModal @success="getPageData" />
    <KnowledgeDocumentShareDialogModal />
    <KnowledgeContentPermissionFormModal @success="handleContentChanged" />
    <KnowledgeContentMoveDialogModal @success="handleMoveChanged" />
  </Page>
</template>
