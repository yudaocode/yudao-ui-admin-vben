<script lang="ts" setup>
import type { KnowledgeContentView, KnowledgeTreeNode } from './types';

import { computed, nextTick, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElEmpty,
  ElTree,
} from 'element-plus';

import {
  canDeleteKnowledgeContent,
  canEditKnowledgeContent,
  canManageKnowledgeContent,
} from '#/views/pms/kb/utils/permission';

import { getKnowledgeTreeNodeIcon } from './types';

defineOptions({ name: 'PmsKnowledgeLibrarySidebar' });

const props = defineProps<{
  activeView: KnowledgeContentView;
  canCreateDocument: boolean;
  canCreateFolder: boolean;
  currentNodeKey?: string;
  treeData: KnowledgeTreeNode[];
  writeStatus: boolean;
}>(); // 组件参数

const emit = defineEmits([
  'home',
  'create',
  'nodeClick',
  'nodeAction',
  'recycle',
]); // 组件事件

const treeRef = ref<InstanceType<typeof ElTree>>(); // 目录树 Ref

const defaultExpandedNodeKeys = computed(() =>
  props.currentNodeKey ? [props.currentNodeKey] : [],
); // 默认展开当前内容的目录链路

/** 同步目录树的当前节点，并自动展开其全部父级目录 */
async function setCurrentNode() {
  await nextTick();
  treeRef.value?.setCurrentKey(props.currentNodeKey as any, true);
}

watch([() => props.currentNodeKey, () => props.treeData], () => {
  setCurrentNode();
});
</script>

<template>
  <div class="px-1 pb-4 pl-4 pt-2 text-sm">
    <!-- 主页入口 -->
    <div
      class="flex h-10 cursor-pointer items-center gap-1.5 rounded-[var(--el-border-radius-base)] px-2 hover:bg-[var(--el-fill-color-light)]"
      :class="{
        'bg-[var(--el-fill-color-light)] text-[var(--el-color-primary)]':
          activeView === 'home',
      }"
      @click="emit('home')"
    >
      <IconifyIcon icon="ep:home-filled" />
      <span>主页</span>
    </div>

    <!-- 知识库目录 -->
    <div class="flex h-10 items-center justify-between px-2">
      <div class="flex min-w-0 items-center gap-1.5 font-semibold">
        <span>目录</span>
      </div>
      <div>
        <ElDropdown
          v-if="canCreateFolder || canCreateDocument"
          v-access:code="['pms:kb:library:update']"
          trigger="click"
          @command="emit('create', $event)"
        >
          <ElButton link>
            <IconifyIcon icon="ep:plus" />
          </ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem v-if="canCreateDocument" command="document">
                创建文档
              </ElDropdownItem>
              <ElDropdownItem v-if="canCreateFolder" command="folder">
                创建文件夹
              </ElDropdownItem>
              <ElDropdownItem v-if="canCreateDocument" command="upload">
                上传文件
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </div>
    </div>
    <ElTree
      v-if="treeData.length"
      ref="treeRef"
      :current-node-key="currentNodeKey"
      :data="treeData"
      :default-expanded-keys="defaultExpandedNodeKeys"
      class="knowledge-sidebar-tree"
      highlight-current
      node-key="key"
      @node-click="emit('nodeClick', $event)"
    >
      <template #default="{ data }">
        <div class="group flex min-w-0 items-center gap-1.5">
          <IconifyIcon :icon="getKnowledgeTreeNodeIcon(data)" />
          <span class="min-w-0 flex-1 truncate">{{ data.label }}</span>
          <ElDropdown
            v-if="
              canEditKnowledgeContent(data.currentUserLevel) ||
              canDeleteKnowledgeContent(data.currentUserLevel)
            "
            trigger="click"
            @command="emit('nodeAction', data, $event)"
          >
            <ElButton
              class="!h-6 !w-6 opacity-0 group-hover:opacity-100"
              link
              @click.stop
            >
              <IconifyIcon icon="ep:more-filled" />
            </ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem
                  v-if="
                    data.kind === 'folder' &&
                    canEditKnowledgeContent(data.currentUserLevel)
                  "
                  v-access:code="['pms:kb:library:update']"
                  command="create-document"
                >
                  新建文档
                </ElDropdownItem>
                <ElDropdownItem
                  v-if="
                    data.kind === 'folder' &&
                    canEditKnowledgeContent(data.currentUserLevel)
                  "
                  v-access:code="['pms:kb:library:update']"
                  command="create-folder"
                >
                  新建文件夹
                </ElDropdownItem>
                <ElDropdownItem
                  v-if="
                    data.kind === 'folder' &&
                    canEditKnowledgeContent(data.currentUserLevel)
                  "
                  v-access:code="['pms:kb:library:update']"
                  command="upload"
                >
                  上传文件
                </ElDropdownItem>
                <ElDropdownItem
                  v-if="canEditKnowledgeContent(data.currentUserLevel)"
                  v-access:code="['pms:kb:library:update']"
                  command="rename"
                >
                  重命名
                </ElDropdownItem>
                <ElDropdownItem
                  v-if="canManageKnowledgeContent(data.currentUserLevel)"
                  v-access:code="['pms:kb:library:update']"
                  command="move"
                >
                  移动
                </ElDropdownItem>
                <ElDropdownItem
                  v-if="canDeleteKnowledgeContent(data.currentUserLevel)"
                  v-access:code="['pms:kb:library:delete']"
                  command="delete"
                  divided
                >
                  删除
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </div>
      </template>
    </ElTree>
    <ElEmpty v-else :image-size="72" description="暂无目录或文档" />

    <!-- 最近删除入口 -->
    <div v-if="writeStatus">
      <div
        v-access:code="['pms:kb:library:delete']"
        class="flex h-10 cursor-pointer items-center gap-1.5 rounded-[var(--el-border-radius-base)] px-2 hover:bg-[var(--el-fill-color-light)]"
        :class="{
          'bg-[var(--el-fill-color-light)] text-[var(--el-color-primary)]':
            activeView === 'recycle',
        }"
        @click="emit('recycle')"
      >
        <IconifyIcon icon="ep:delete" />
        最近删除
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.knowledge-sidebar-tree {
  padding-right: 8px;
  background-color: transparent;
}

:deep(.el-tree-node__content) {
  height: 40px;
  padding-right: 4px;
  border-radius: var(--el-border-radius-base);
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  color: var(--el-color-primary);
  background-color: var(--el-fill-color-light);
}
</style>
