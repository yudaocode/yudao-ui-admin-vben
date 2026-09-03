<script lang="ts" setup>
import type { KnowledgeContentView, KnowledgeTreeNode } from './types';

import { computed, nextTick, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Dropdown, Empty, Menu, MenuItem, Tree } from 'antdv-next';

import {
  canDeleteKnowledgeContent,
  canEditKnowledgeContent,
  canManageKnowledgeContent,
} from '#/views/pms/kb/utils/permission';

import { getKnowledgeTreeNodeIcon } from './types';

defineOptions({ name: 'PmsKnowledgeLibrarySidebar' });

// TODO @AI：树可以保留自定义；三端节点菜单和拖拽行为对齐。

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

const treeRef = ref<any>(); // 目录树 Ref

const defaultExpandedNodeKeys = computed(() =>
  props.currentNodeKey ? [props.currentNodeKey] : [],
); // 默认展开当前内容的目录链路
const antTreeData = computed(() =>
  props.treeData.map(function mapNode(node): any {
    return {
      key: node.key,
      title: node.label,
      node,
      children: node.children.map(mapNode),
    };
  }),
); // antd Tree 数据

/** 同步目录树的当前节点，并自动展开其全部父级目录 */
async function setCurrentNode() {
  await nextTick();
  treeRef.value?.setCurrentKey?.(props.currentNodeKey, true);
}

watch([() => props.currentNodeKey, () => props.treeData], () => {
  setCurrentNode();
});
</script>

<template>
  <div class="px-1 pb-4 pl-4 pt-2 text-sm">
    <!-- 主页入口 -->
    <div
      class="flex h-10 cursor-pointer items-center gap-1.5 rounded px-2 hover:bg-accent"
      :class="{ 'bg-accent text-primary': activeView === 'home' }"
      @click="emit('home')"
    >
      <IconifyIcon icon="lucide:house" />
      <span>主页</span>
    </div>

    <!-- 知识库目录 -->
    <div class="flex h-10 items-center justify-between px-2">
      <div class="flex min-w-0 items-center gap-1.5 font-semibold">
        <span>目录</span>
      </div>
      <div>
        <Dropdown
          v-if="canCreateFolder || canCreateDocument"
          v-access:code="['pms:kb:library:update']"
          :trigger="['click']"
        >
          <Button type="link">
            <IconifyIcon icon="lucide:plus" />
          </Button>
          <template #popupRender>
            <Menu @click="({ key }: any) => emit('create', key)">
              <MenuItem v-if="canCreateDocument" key="document">
                创建文档
              </MenuItem>
              <MenuItem v-if="canCreateFolder" key="folder">
                创建文件夹
              </MenuItem>
              <MenuItem v-if="canCreateDocument" key="upload">
                上传文件
              </MenuItem>
            </Menu>
          </template>
        </Dropdown>
      </div>
    </div>
    <Tree
      v-if="treeData.length"
      ref="treeRef"
      :default-expanded-keys="defaultExpandedNodeKeys"
      :selected-keys="currentNodeKey ? [currentNodeKey] : []"
      :tree-data="antTreeData"
      class="knowledge-sidebar-tree"
      @select="
        (_keys: any, info: any) =>
          info.node?.node && emit('nodeClick', info.node.node)
      "
    >
      <template #titleRender="node">
        <div class="group flex min-w-0 items-center gap-1.5">
          <IconifyIcon
            :icon="getKnowledgeTreeNodeIcon(node as KnowledgeTreeNode)"
          />
          <span class="min-w-0 flex-1 truncate">{{ node.label }}</span>
          <Dropdown
            v-if="
              canEditKnowledgeContent(node.currentUserLevel) ||
              canDeleteKnowledgeContent(node.currentUserLevel)
            "
            :trigger="['click']"
          >
            <Button
              class="!h-6 !w-6 opacity-0 group-hover:opacity-100"
              type="link"
              @click.stop
            >
              <IconifyIcon icon="lucide:ellipsis" />
            </Button>
            <template #popupRender>
              <Menu
                @click="
                  ({ key, domEvent }: any) => {
                    domEvent.stopPropagation();
                    emit('nodeAction', node, key);
                  }
                "
              >
                <MenuItem
                  v-if="
                    node.kind === 'folder' &&
                    canEditKnowledgeContent(node.currentUserLevel)
                  "
                  v-access:code="['pms:kb:library:update']"
                  key="create-document"
                >
                  新建文档
                </MenuItem>
                <MenuItem
                  v-if="
                    node.kind === 'folder' &&
                    canEditKnowledgeContent(node.currentUserLevel)
                  "
                  v-access:code="['pms:kb:library:update']"
                  key="create-folder"
                >
                  新建文件夹
                </MenuItem>
                <MenuItem
                  v-if="
                    node.kind === 'folder' &&
                    canEditKnowledgeContent(node.currentUserLevel)
                  "
                  v-access:code="['pms:kb:library:update']"
                  key="upload"
                >
                  上传文件
                </MenuItem>
                <MenuItem
                  v-if="canEditKnowledgeContent(node.currentUserLevel)"
                  v-access:code="['pms:kb:library:update']"
                  key="rename"
                >
                  重命名
                </MenuItem>
                <MenuItem
                  v-if="canManageKnowledgeContent(node.currentUserLevel)"
                  v-access:code="['pms:kb:library:update']"
                  key="move"
                >
                  移动
                </MenuItem>
                <MenuItem
                  v-if="canDeleteKnowledgeContent(node.currentUserLevel)"
                  v-access:code="['pms:kb:library:delete']"
                  key="delete"
                >
                  删除
                </MenuItem>
              </Menu>
            </template>
          </Dropdown>
        </div>
      </template>
    </Tree>
    <Empty v-else description="暂无目录或文档" />

    <!-- 最近删除入口 -->
    <div v-if="writeStatus">
      <div
        v-access:code="['pms:kb:library:delete']"
        class="flex h-10 cursor-pointer items-center gap-1.5 rounded px-2 hover:bg-accent"
        :class="{ 'bg-accent text-primary': activeView === 'recycle' }"
        @click="emit('recycle')"
      >
        <IconifyIcon icon="lucide:trash-2" />
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

:deep(.ant-tree .ant-tree-node-content-wrapper) {
  display: flex;
  align-items: center;
  height: 40px;
  padding-right: 4px;
  border-radius: 6px;
}

:deep(.ant-tree .ant-tree-treenode-selected .ant-tree-node-content-wrapper) {
  color: #1677ff;
  background-color: #f5f5f5;
}
</style>
