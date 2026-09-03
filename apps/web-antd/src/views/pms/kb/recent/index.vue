<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeInteractionApi } from '#/api/pms/kb/interaction/types';
import type { PmsKnowledgeViewRecordApi } from '#/api/pms/kb/interaction/view-record';

import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Button, Tabs } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getKnowledgeRecentViewRecordList } from '#/api/pms/kb/interaction/view-record';
import {
  getKnowledgeObjectIcon,
  getKnowledgeObjectTypeName,
} from '#/views/pms/kb/utils/format';

import { useGridColumns } from './data';

defineOptions({ name: 'PmsKnowledgeRecent' });

const router = useRouter(); // 路由对象
const activeTab =
  ref<keyof PmsKnowledgeViewRecordApi.KnowledgeRecentList>('todayItems'); // 当前时间分组
const recent = reactive<PmsKnowledgeViewRecordApi.KnowledgeRecentList>({
  todayItems: [],
  yesterdayItems: [],
  recent30DayItems: [],
}); // 最近浏览数据

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          Object.assign(recent, await getKnowledgeRecentViewRecordList());
          const activeItems = recent[activeTab.value];
          return {
            list: activeItems,
            total: activeItems.length,
          };
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
  } as VxeTableGridOptions<PmsKnowledgeInteractionApi.KnowledgeInteractionItem>,
});

/** 切换时间分组 */
async function handleTabChange() {
  // 三个时间分组由同一次查询返回，切换页签直接复用已查询的数据
  await gridApi.grid.loadData(recent[activeTab.value]);
}

/** 打开内容详情 */
function openItem(item: PmsKnowledgeInteractionApi.KnowledgeInteractionItem) {
  if (item.documentId) {
    router.push(
      `/pms/kb/library/${item.libraryId}/document/${item.documentId}`,
    );
    return;
  }
  router.push(`/pms/kb/library/${item.libraryId}/folder/${item.folderId}`);
}
</script>

<template>
  <Page auto-content-height>
    <!-- 最近浏览列表 -->
    <Grid>
      <template #toolbar-actions>
        <!-- 时间分组 -->
        <Tabs
          v-model:active-key="activeTab"
          class="recent-tabs w-full"
          @change="handleTabChange"
        >
          <Tabs.TabPane key="todayItems" tab="今天" />
          <Tabs.TabPane key="yesterdayItems" tab="昨天" />
          <Tabs.TabPane key="recent30DayItems" tab="最近 30 天" />
        </Tabs>
      </template>
      <!-- TODO @AI：宽度没占满；是不是别的，可能也有类似问题； -->
      <!-- TODO @AI：很多这里的 format 逻辑，是不是都适合放到 data.ts 里？你分析下； -->
      <template #name="{ row }">
        <Button class="!p-0" type="link" @click="openItem(row)">
          <IconifyIcon
            class="mr-1.5"
            :icon="getKnowledgeObjectIcon(row.type)"
          />
          {{ row.name }}
        </Button>
      </template>
      <template #type="{ row }">
        {{ getKnowledgeObjectTypeName(row.type) }}
      </template>
      <template #createTime="{ row }">
        {{ formatDateTime(row.createTime) }}
      </template>
    </Grid>
  </Page>
</template>

<style lang="scss" scoped>
.recent-tabs {
  :deep(.ant-tabs-nav) {
    margin-bottom: 0;
  }
}
</style>
