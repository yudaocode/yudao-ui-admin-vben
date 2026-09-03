<script lang="ts" setup>
import type { KnowledgeTreeNode } from './types';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeInteractionApi } from '#/api/pms/kb/interaction/types';
import type { PmsKnowledgeLibraryApi } from '#/api/pms/kb/library';

import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Dropdown, Empty, Menu, Tabs } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { PmsKnowledgeObjectType } from '#/views/pms/kb/utils/constants';

import { useLibraryHomeGridColumns } from './data';
import {
  getKnowledgeTreeNodeIcon,
} from './types';

defineOptions({ name: 'PmsKnowledgeLibraryHome' });

// TODO @AI：已用 VXE 的话补 toolbarConfig。antd/antdv-next 不要用 v-loading。

const props = defineProps<{
  favoriteItems: PmsKnowledgeInteractionApi.KnowledgeInteractionItem[];
  favoriteLoading: boolean;
  library?: PmsKnowledgeLibraryApi.KnowledgeLibrary;
  treeData: KnowledgeTreeNode[];
  writeStatus: boolean;
}>(); // 组件参数

const emit = defineEmits<{
  (event: 'collect'): void;
  (event: 'exit'): void;
  (event: 'member'): void;
  (event: 'nodeClick', node: KnowledgeTreeNode): void;
  (event: 'search'): void;
  (event: 'tabChange', tab: 'all' | 'favorite'): void;
}>(); // 组件事件

const activeTab = ref<'all' | 'favorite'>('all'); // 当前内容页签
const displayNodes = computed<KnowledgeTreeNode[]>(() => {
  if (activeTab.value === 'all') {
    return props.treeData;
  }
  return props.favoriteItems
    .filter(
      (item) =>
        item.type === PmsKnowledgeObjectType.FOLDER ||
        item.type === PmsKnowledgeObjectType.DOCUMENT ||
        item.type === PmsKnowledgeObjectType.FILE,
    )
    .map((item) => ({
      key: `${item.type === PmsKnowledgeObjectType.FOLDER ? 'folder' : 'document'}-${item.entityId}`,
      entityId: item.entityId,
      kind: item.type === PmsKnowledgeObjectType.FOLDER ? 'folder' : 'document',
      label: item.name,
      type: item.type,
      children: [],
    }));
}); // 当前页签展示内容

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellClick: ({ row }: { row: KnowledgeTreeNode }) => emit('nodeClick', row),
  },
  gridOptions: {
    columns: useLibraryHomeGridColumns(),
    data: [],
    pagerConfig: {
      enabled: false,
    },
    rowConfig: {
      isHover: true,
      keyField: 'key',
    },
    showHeader: false,
    toolbarConfig: {
      enabled: false,
    },
    treeConfig: {
      childrenField: 'children',
    },
  } as VxeTableGridOptions<KnowledgeTreeNode>,
});

/** 刷新内容列表 */
function refreshGridData() {
  gridApi.setGridOptions({ data: displayNodes.value });
}

watch(displayNodes, refreshGridData, { immediate: true });

/** 处理更多操作 */
function handleMoreCommand(command: 'collect' | 'exit' | 'member') {
  if (command === 'collect') {
    emit('collect');
  } else if (command === 'member') {
    emit('member');
  } else {
    emit('exit');
  }
}

/** 切换内容页签 */
function handleTabChange(tab: number | string) {
  emit('tabChange', tab === 'favorite' ? 'favorite' : 'all');
}
</script>

<template>
  <!-- 知识库主页 -->
  <div class="mb-6 flex items-start justify-between gap-6 max-[900px]:flex-col">
    <div class="min-w-0 flex-1">
      <div class="truncate text-xl font-semibold">{{ library?.name }}</div>
      <div
        class="mt-2.5 max-w-[720px] rounded bg-accent px-4 py-3 text-sm leading-[1.6] text-muted-foreground"
      >
        {{ library?.description || '暂无简介' }}
      </div>
    </div>
    <Button class="!ml-auto shrink-0" type="primary" @click="emit('search')">
      <IconifyIcon icon="lucide:search" />搜索文档
    </Button>
    <!-- 知识库操作只在主页展示 -->
    <Dropdown>
      <Button>更多</Button>
      <template #overlay>
        <Menu @click="({ key }: any) => handleMoreCommand(key)">
          <Menu.Item key="collect">
            {{ library?.favoriteStatus ? '取消关注' : '关注' }}
          </Menu.Item>
          <Menu.Item
            v-if="writeStatus && library?.adminStatus"
            v-access:code="['pms:kb:library:update']"
            key="member"
          >
            成员管理
          </Menu.Item>
          <Menu.Item v-if="library?.exitStatus" key="exit">
            退出知识库
          </Menu.Item>
        </Menu>
      </template>
    </Dropdown>
  </div>
  <Tabs v-model:active-key="activeTab" class="mb-3" @change="handleTabChange">
    <Tabs.TabPane key="all" tab="全部文档" />
    <Tabs.TabPane key="favorite" tab="我关注的" />
  </Tabs>
  <div v-loading="favoriteLoading">
    <!-- 目录与关注内容 -->
    <Grid class="knowledge-content-table">
      <template #label="{ row }">
        <div class="flex cursor-pointer items-center gap-2">
          <IconifyIcon :icon="getKnowledgeTreeNodeIcon(row)" />
          <span>{{ row.label }}</span>
        </div>
      </template>
      <template #empty>
        <Empty
          :description="
            activeTab === 'favorite' ? '暂无关注内容' : '暂无目录或文档'
          "
        />
      </template>
    </Grid>
  </div>
</template>

<style lang="scss" scoped>
:deep(.knowledge-content-table .vxe-body--row) {
  height: 48px;
  font-size: 14px;
  cursor: pointer;
}
</style>
