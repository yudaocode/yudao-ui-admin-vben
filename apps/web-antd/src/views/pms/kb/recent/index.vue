<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeInteractionApi } from '#/api/pms/kb/interaction/types';
import type { PmsKnowledgeViewRecordApi } from '#/api/pms/kb/interaction/view-record';

import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Tabs } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getKnowledgeRecentViewRecordList } from '#/api/pms/kb/interaction/view-record';
import { getKnowledgeObjectIcon } from '#/views/pms/kb/utils/format';

import { useGridColumns } from './data';

defineOptions({ name: 'PmsKnowledgeRecent' });

// TODO @AI：antd 给 Tabs 加了 scoped 去 margin，ele 没有；三端 Tabs 样式对齐。补 toolbarConfig。
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
  await gridApi.grid.loadData(recent[activeTab.value]);
}

/** 打开内容详情 */
function openItem(item: PmsKnowledgeInteractionApi.KnowledgeInteractionItem) {
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
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【PMS】文档与协作"
        url="https://doc.iocoder.cn/pms/kb/document/"
      />
    </template>
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
      <template #name="{ row }">
        <Button class="!p-0" type="link" @click="openItem(row)">
          <IconifyIcon
            class="mr-1.5"
            :icon="getKnowledgeObjectIcon(row.type)"
          />
          {{ row.name }}
        </Button>
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
