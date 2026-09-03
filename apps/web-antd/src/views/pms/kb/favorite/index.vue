<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeInteractionApi } from '#/api/pms/kb/interaction/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, DocAlert, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, message, Switch, Tabs } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteKnowledgeFavorite,
  getKnowledgeFavoritePage,
} from '#/api/pms/kb/interaction/favorite';
import { PmsKnowledgeObjectType } from '#/views/pms/kb/utils/constants';
import {
  formatKnowledgeFileSize,
  getKnowledgeObjectIcon,
} from '#/views/pms/kb/utils/format';

import { useGridColumns } from './data';

// TODO @AI：貌似这个模块不应该是 collection？而是 favorite？如果是，貌似 vue3 + ep、uniapp 都要改下；还有相关的 doc、cloud 文档；（修复完，不要直接删除）；
// TODO DONE @AI：该页面实际调用 `/pms/kb/favorite` 接口并展示用户关注内容，已统一命名为 favorite。
defineOptions({ name: 'PmsKnowledgeFavorite' });

const router = useRouter(); // 路由
const activeType = ref('all'); // 当前对象类型

/** 切换关注类型 */
function handleTypeChange() {
  gridApi.query();
}

/** 打开内容详情 */
function openItem(item: PmsKnowledgeInteractionApi.KnowledgeInteractionItem) {
  if (item.type === PmsKnowledgeObjectType.LIBRARY) {
    router.push(`/pms/kb/library/${item.libraryId}`);
    return;
  }
  if (item.documentId) {
    router.push(
      {
        path: `/pms/kb/library/${item.libraryId}`,
        query: { documentId: String(item.documentId) },
      },
    );
    return;
  }
  router.push({
      path: `/pms/kb/library/${item.libraryId}`,
      query: { folderId: String(item.folderId) },
    });
}

/** 取消关注 */
async function handleCancelFavorite(
  item: PmsKnowledgeInteractionApi.KnowledgeInteractionItem,
) {
  try {
    // 取消关注的二次确认
    await confirm(`确认取消关注“${item.name}”吗？`);
    // 发起取消关注
    await deleteKnowledgeFavorite(item.type, item.entityId);
    message.success('已取消关注');
    // 刷新列表
    await gridApi.reload();
  } catch {
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getKnowledgeFavoritePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            type:
              activeType.value === 'all' ? undefined : Number(activeType.value),
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
  } as VxeTableGridOptions<PmsKnowledgeInteractionApi.KnowledgeInteractionItem>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【PMS】文档与协作"
        url="https://doc.iocoder.cn/pms/kb/document/"
      />
    </template>
    <!-- 关注列表 -->
    <Grid>
      <template #toolbar-actions>
        <!-- 对象类型 -->
        <Tabs
          v-model:active-key="activeType"
          class="w-full"
          @change="handleTypeChange"
        >
          <Tabs.TabPane key="all" tab="全部" />
          <Tabs.TabPane key="1" tab="知识库" />
          <Tabs.TabPane key="3" tab="文档" />
          <Tabs.TabPane key="2" tab="文件夹" />
          <Tabs.TabPane key="4" tab="文件" />
        </Tabs>
      </template>
      <template #name="{ row }">
        <Button class="!p-0" type="link" @click="openItem(row)">
          <IconifyIcon
            class="mr-1.5"
            :icon="getKnowledgeObjectIcon(row.type)"
          />
          {{ row.name }}
        </Button>
        <div v-if="row.description" class="text-xs text-muted-foreground">
          {{ row.description }}
        </div>
        <div
          v-if="row.fileType || row.fileSize != null"
          class="text-xs text-muted-foreground"
        >
          <span v-if="row.fileType">{{ row.fileType.toUpperCase() }}</span>
          <span v-if="row.fileType && row.fileSize != null"> · </span>
          <span v-if="row.fileSize != null">
            {{ formatKnowledgeFileSize(row.fileSize) }}
          </span>
        </div>
      </template>
      <template #favorite="{ row }">
        <Switch :checked="true" @change="handleCancelFavorite(row)" />
      </template>
    </Grid>
  </Page>
</template>
