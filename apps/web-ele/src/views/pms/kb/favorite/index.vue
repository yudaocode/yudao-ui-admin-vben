<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeInteractionApi } from '#/api/pms/kb/interaction/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, DocAlert, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { ElLink, ElMessage, ElSwitch, ElTabPane, ElTabs } from 'element-plus';

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
    ElMessage.success('已取消关注');
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
        <ElTabs
          v-model="activeType"
          class="w-full"
          @tab-change="handleTypeChange"
        >
          <ElTabPane label="全部" name="all" />
          <ElTabPane label="知识库" name="1" />
          <ElTabPane label="文档" name="3" />
          <ElTabPane label="文件夹" name="2" />
          <ElTabPane label="文件" name="4" />
        </ElTabs>
      </template>
      <template #name="{ row }">
        <ElLink type="primary" @click="openItem(row)">
          <IconifyIcon
            class="mr-1.5"
            :icon="getKnowledgeObjectIcon(row.type)"
          />
          {{ row.name }}
        </ElLink>
        <div
          v-if="row.description"
          class="text-xs text-[var(--el-text-color-secondary)]"
        >
          {{ row.description }}
        </div>
        <div
          v-if="row.fileType || row.fileSize != null"
          class="text-xs text-[var(--el-text-color-secondary)]"
        >
          <span v-if="row.fileType">{{ row.fileType.toUpperCase() }}</span>
          <span v-if="row.fileType && row.fileSize != null"> · </span>
          <span v-if="row.fileSize != null">
            {{ formatKnowledgeFileSize(row.fileSize) }}
          </span>
        </div>
      </template>
      <template #favorite="{ row }">
        <ElSwitch :model-value="true" @change="handleCancelFavorite(row)" />
      </template>
    </Grid>
  </Page>
</template>
