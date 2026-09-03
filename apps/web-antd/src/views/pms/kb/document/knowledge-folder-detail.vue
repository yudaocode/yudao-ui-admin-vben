<script lang="ts" setup>
import type { KnowledgeTreeNode } from './types';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeFolderApi } from '#/api/pms/kb/content/folder';

import { computed, watch } from 'vue';

import { confirm } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Dropdown, Empty, Menu, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteKnowledgeFolder } from '#/api/pms/kb/content/folder';
import { PmsKnowledgeContentLevel } from '#/views/pms/kb/utils/constants';
import {
  canDeleteKnowledgeContent,
  canEditKnowledgeContent,
} from '#/views/pms/kb/utils/permission';

import { useFolderContentGridColumns } from './data';
import {
  getKnowledgeTreeNodeIcon,
} from './types';

defineOptions({ name: 'PmsKnowledgeFolderDetail' });

// TODO @AI：内容列表已用 VXE 的话操作列走 TableAction。antd/antdv-next 不要用 v-loading。

const props = defineProps<{
  children: KnowledgeTreeNode[];
  folder: PmsKnowledgeFolderApi.KnowledgeFolder;
}>(); // 组件参数

const emit = defineEmits([
  'collect',
  'permission',
  'update',
  'move',
  'delete',
  'nodeClick',
]); // 组件事件

const canManage = computed(
  () => props.folder.currentUserLevel === PmsKnowledgeContentLevel.MANAGE,
); // 是否可管理文件夹协作权限

interface CellClickEvent {
  row: KnowledgeTreeNode;
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellClick: ({ row }: CellClickEvent) => emit('nodeClick', row),
  },
  gridOptions: {
    columns: useFolderContentGridColumns(),
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () => props.children,
      },
    },
    rowConfig: {
      height: 48,
      isHover: true,
      keyField: 'key',
    },
    showHeader: false,
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<KnowledgeTreeNode>,
});

// 文件夹内容变化时刷新表格
watch(
  () => props.children,
  () => gridApi.query(),
);

/** 处理更多操作 */
async function handleMoreCommand(command: string) {
  if (command === 'delete') {
    await handleDelete();
    return;
  }
  if (command === 'update' || command === 'move') {
    emit(command);
  }
}

/** 删除文件夹 */
async function handleDelete() {
  try {
    // 删除的二次确认
    await confirm(`确认删除文件夹“${props.folder.title}”及其全部内容吗？`);
    // 发起删除
    await deleteKnowledgeFolder(props.folder.id);
    message.success('删除成功');
    // 通知父组件刷新目录树
    emit('delete');
  } catch {}
}
</script>

<template>
  <!-- 文件夹信息与快捷操作 -->
  <div
    class="mb-2 flex items-center justify-between gap-6 border-0 border-b border-solid border-border pb-6 pt-2 max-[900px]:flex-col max-[900px]:items-start"
  >
    <div>
      <div class="flex items-center gap-2 text-2xl font-semibold">
        <IconifyIcon icon="lucide:folder" />{{ folder.title }}
      </div>
      <div class="mt-2 text-[13px] text-muted-foreground">
        创建于 {{ formatDateTime(folder.createTime) }} · 子文件夹
        {{ folder.childFolderCount ?? 0 }} 个 · 文档
        {{ folder.documentCount ?? 0 }} 篇
      </div>
    </div>
    <div class="flex shrink-0 flex-wrap items-center gap-2">
      <Button
        v-if="canManage"
        v-access:code="['pms:kb:library:update']"
        class="!ml-0"
        size="small"
        @click="emit('permission')"
      >
        <IconifyIcon icon="lucide:users" />协作
      </Button>
      <Button class="!ml-0" size="small" @click="emit('collect')">
        <IconifyIcon
          :class="
            folder.favoriteStatus ? 'fill-yellow-500 text-yellow-500' : ''
          "
          icon="lucide:star"
        />
        {{ folder.favoriteStatus ? '已关注' : '关注' }}
      </Button>
      <Dropdown v-if="canEditKnowledgeContent(folder.currentUserLevel)">
        <Button class="!ml-0" size="small">
          <IconifyIcon icon="lucide:ellipsis" />
        </Button>
        <template #overlay>
          <Menu @click="({ key }: any) => handleMoreCommand(key)">
            <Menu.Item v-access:code="['pms:kb:library:update']" key="update">
              重命名
            </Menu.Item>
            <Menu.Item
              v-if="canManage"
              v-access:code="['pms:kb:library:update']"
              key="move"
            >
              移动
            </Menu.Item>
            <Menu.Divider
              v-if="canDeleteKnowledgeContent(folder.currentUserLevel)"
            />
            <Menu.Item
              v-if="canDeleteKnowledgeContent(folder.currentUserLevel)"
              v-access:code="['pms:kb:library:delete']"
              key="delete"
            >
              删除
            </Menu.Item>
          </Menu>
        </template>
      </Dropdown>
    </div>
  </div>

  <!-- 文件夹直属内容 -->
  <div class="mb-2 text-base font-semibold">文件夹内容</div>
  <Grid class="knowledge-content-table">
    <template #label="{ row }">
      <div class="flex cursor-pointer items-center gap-2">
        <IconifyIcon :icon="getKnowledgeTreeNodeIcon(row)" />
        <span>{{ row.label }}</span>
      </div>
    </template>
    <template #empty>
      <Empty description="该文件夹暂无内容" />
    </template>
  </Grid>
</template>

<style lang="scss" scoped>
:deep(.knowledge-content-table .vxe-body--row) {
  font-size: 14px;
  cursor: pointer;
}
</style>
