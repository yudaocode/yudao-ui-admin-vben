<script lang="ts" setup>
import type { PmsKnowledgeRecycleApi } from '#/api/pms/kb/recycle';

import { computed, onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';
import {
  ElAlert,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElButton,
  ElEmpty,
  ElTag,
} from 'element-plus';

import { getKnowledgeContentRecyclePreview } from '#/api/pms/kb/recycle';
import { FilePreview } from '#/components/file-preview';
import { PmsKnowledgeObjectType } from '#/views/pms/kb/utils/constants';
import { formatKnowledgeFileSize } from '#/views/pms/kb/utils/format';

defineOptions({ name: 'PmsKnowledgeRecycleDetail' });

// TODO @AI：antd/antdv-next 不要用 v-loading。删除时间用 formatDateTime，不要页面里 dayjs.format。

const props = defineProps<{
  detail: PmsKnowledgeRecycleApi.KnowledgeRecycleDetail;
}>();

const emit = defineEmits<{
  back: [];
  permanentDelete: [record: PmsKnowledgeRecycleApi.KnowledgeRecycle];
  restore: [record: PmsKnowledgeRecycleApi.KnowledgeRecycle];
}>();

type DetailNode = {
  folderId?: number;
  id: number;
  key: string;
  name: string;
  parentId?: number;
  type: number;
};

const currentKey = ref('');
const previewLoading = ref(false);
const preview = ref<PmsKnowledgeRecycleApi.KnowledgeRecyclePreview>();
const nodes = computed<DetailNode[]>(() => [
  {
    key: nodeKey(props.detail.root.type, props.detail.root.entityId),
    id: props.detail.root.entityId,
    type: props.detail.root.type,
    name: props.detail.root.name,
  },
  ...props.detail.children.map((item) => ({
    key: nodeKey(item.type, item.id),
    id: item.id,
    type: item.type,
    name: item.name,
    parentId: item.parentId,
    folderId: item.folderId,
  })),
]);
const currentNode = computed(
  () =>
    nodes.value.find((node) => node.key === currentKey.value) ||
    nodes.value[0]!,
);
const currentChildren = computed(() => {
  if (
    !currentNode.value ||
    currentNode.value.type !== PmsKnowledgeObjectType.FOLDER
  ) {
    return [];
  }
  return nodes.value.filter(
    (node) =>
      node.key !== currentNode.value.key &&
      (node.parentId === currentNode.value.id ||
        ((!node.parentId || node.parentId === 0) &&
          node.folderId === currentNode.value.id)),
  );
});
const breadcrumbs = computed(() => {
  if (!currentNode.value) {
    return [];
  }
  const result: DetailNode[] = [];
  let node: DetailNode | undefined = currentNode.value;
  while (node) {
    result.unshift(node);
    const parentId: number | undefined = node.parentId || node.folderId;
    node = parentId
      ? nodes.value.find((item) => item.id === parentId)
      : undefined;
  }
  if (result[0]?.key !== nodes.value[0]?.key) {
    result.unshift(nodes.value[0]!);
  }
  return result;
});

function nodeKey(type: number, id: number) {
  return `${type}-${id}`;
}

/** 打开回收站详情节点，并按需加载文档或文件预览 */
async function openNode(key: string) {
  currentKey.value = key;
  const node = nodes.value.find((item) => item.key === key);
  if (!node || node.type === PmsKnowledgeObjectType.FOLDER) {
    preview.value = undefined;
    return;
  }
  previewLoading.value = true;
  try {
    preview.value = await getKnowledgeContentRecyclePreview(
      props.detail.root.id,
      node.id,
    );
  } finally {
    previewLoading.value = false;
  }
}

onMounted(() => openNode(nodes.value[0]?.key || ''));
</script>

<template>
  <div>
    <!-- 详情头部：提供返回回收站、层级导航和当前对象操作 -->
    <div
      class="mb-4 flex items-center justify-between gap-4 border-0 border-b border-solid border-[var(--el-border-color-lighter)] pb-3"
    >
      <div class="flex min-w-0 items-center gap-2">
        <ElButton link type="primary" @click="emit('back')">
          <IconifyIcon icon="ep:arrow-left" />最近删除
        </ElButton>
        <ElBreadcrumb separator="/" class="min-w-0">
          <ElBreadcrumbItem v-for="item in breadcrumbs" :key="item.key">
            <ElButton
              link
              class="max-w-[220px] truncate !text-sm"
              @click="openNode(item.key)"
            >
              {{ item.name }}
            </ElButton>
          </ElBreadcrumbItem>
        </ElBreadcrumb>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <ElButton
          size="small"
          type="primary"
          @click="emit('restore', detail.root)"
        >
          <IconifyIcon icon="ep:refresh-left" />恢复
        </ElButton>
        <ElButton
          size="small"
          type="danger"
          @click="emit('permanentDelete', detail.root)"
        >
          <IconifyIcon icon="ep:delete" />彻底删除
        </ElButton>
      </div>
    </div>

    <ElAlert
      :closable="false"
      :title="`“${detail.root.name}”删除于 ${detail.root.deleteTime ? dayjs(detail.root.deleteTime).format('YYYY-MM-DD HH:mm') : '未知时间'}`"
      class="!mb-3"
      type="info"
    />

    <!-- 文件夹详情：展示当前目录及其级联删除的子对象 -->
    <div v-if="currentNode.type === PmsKnowledgeObjectType.FOLDER">
      <!-- 当前文件夹标题 -->
      <div class="mb-3 flex items-center gap-2.5">
        <IconifyIcon
          icon="ep:folder-opened"
          class="text-[22px] text-[var(--el-color-primary)]"
        />
        <span class="text-lg font-semibold">{{ currentNode.name }}</span>
      </div>
      <!-- 子对象入口：点击后进入对应文件夹或内容预览 -->
      <div
        v-if="currentChildren.length"
        class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3"
      >
        <button
          v-for="item in currentChildren"
          :key="item.key"
          type="button"
          class="flex items-center gap-2.5 rounded-[var(--el-border-radius-base)] border border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)] px-3.5 py-3 text-left transition-colors hover:bg-[var(--el-fill-color-light)]"
          @click="openNode(item.key)"
        >
          <IconifyIcon
            :icon="
              item.type === PmsKnowledgeObjectType.FOLDER
                ? 'ep:folder'
                : 'ep:document'
            "
            class="shrink-0 text-xl text-[var(--el-color-primary)]"
          />
          <span class="min-w-0 flex-1 truncate text-sm">{{ item.name }}</span>
          <IconifyIcon
            icon="ep:arrow-right"
            class="text-[var(--el-text-color-secondary)]"
          />
        </button>
      </div>
      <ElEmpty v-else description="该文件夹没有级联删除内容" />
    </div>

    <!-- 文档或文件详情：按内容类型展示预览 -->
    <div v-else>
      <!-- 当前文档标题 -->
      <div class="mb-3 flex items-center gap-2.5">
        <IconifyIcon
          icon="ep:document"
          class="text-[22px] text-[var(--el-color-primary)]"
        />
        <span class="text-lg font-semibold">{{ currentNode.name }}</span>
      </div>
      <div v-loading="previewLoading">
        <!-- 富文本文档正文预览 -->
        <template
          v-if="preview && currentNode.type === PmsKnowledgeObjectType.DOCUMENT"
        >
          <div
            v-dompurify-html="preview.content || '<p>暂无内容</p>'"
            class="pms-knowledge-rich-text"
          ></div>
        </template>
        <template
          v-else-if="
            preview &&
            currentNode.type === PmsKnowledgeObjectType.FILE &&
            preview.content
          "
        >
          <!-- 文件元数据和在线预览 -->
          <div class="mb-3 flex items-center justify-end gap-2">
            <ElTag type="info">{{ preview.fileType || '文件' }}</ElTag>
            <span
              v-if="preview.fileSize !== undefined && preview.fileSize !== null"
              class="text-xs text-[var(--el-text-color-secondary)]"
            >
              {{ formatKnowledgeFileSize(preview.fileSize) }}
            </span>
          </div>
          <FilePreview
            :file-name="preview.name"
            :file-type="preview.fileType"
            :url="preview.content"
          />
        </template>
        <ElEmpty v-else description="该内容暂无可预览数据" />
      </div>
    </div>
  </div>
</template>
