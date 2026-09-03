<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeRecycleApi } from '#/api/pms/kb/recycle';

import { confirm, DocAlert, Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Alert, message } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getKnowledgeLibraryRecycleList,
  permanentDeleteKnowledgeRecycle,
  restoreKnowledgeRecycle,
} from '#/api/pms/kb/recycle';

import { useGridColumns } from './data';

defineOptions({ name: 'PmsKnowledgeRecycle' });

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 恢复回收站记录 */
async function handleRestore(row: PmsKnowledgeRecycleApi.KnowledgeRecycle) {
  try {
    // 恢复的二次确认
    await confirm(`确认恢复“${row.name}”吗？`);
    // 发起恢复
    await restoreKnowledgeRecycle(row.id);
    message.success('恢复成功');
    // 刷新列表
    handleRefresh();
  } catch {}
}

/** 彻底删除回收站记录 */
async function handlePermanentDelete(
  row: PmsKnowledgeRecycleApi.KnowledgeRecycle,
) {
  try {
    // 删除的二次确认
    await confirm(`彻底删除后不可恢复，确认删除“${row.name}”吗？`);
    // 发起删除
    await permanentDeleteKnowledgeRecycle(row.id);
    message.success('彻底删除成功');
    // 刷新列表
    handleRefresh();
  } catch {}
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          const list = await getKnowledgeLibraryRecycleList();
          return { list, total: list.length };
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
  } as VxeTableGridOptions<PmsKnowledgeRecycleApi.KnowledgeRecycle>,
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
    <!-- 回收站提示 -->
    <Alert
      class="!mb-3"
      :closable="false"
      message="恢复时会保留此前单独删除的子项；彻底删除后无法恢复。"
      show-icon
      type="warning"
    />
    <!-- 列表 -->
    <Grid>
      <template #deleteTime="{ row }">
        {{ formatDateTime(row.deleteTime) }}
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '恢复',
              type: 'link',
              onClick: handleRestore.bind(null, row),
            },
            {
              label: '彻底删除',
              type: 'link',
              danger: true,
              onClick: handlePermanentDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
