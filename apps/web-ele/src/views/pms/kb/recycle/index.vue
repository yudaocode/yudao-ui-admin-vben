<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeRecycleApi } from '#/api/pms/kb/recycle';

import { DocAlert, Page } from '@vben/common-ui';

import { ElAlert, ElMessage } from 'element-plus';

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
  await restoreKnowledgeRecycle(row.id);
  ElMessage.success('恢复成功');
  handleRefresh();
}

/** 彻底删除回收站记录 */
async function handlePermanentDelete(
  row: PmsKnowledgeRecycleApi.KnowledgeRecycle,
) {
  await permanentDeleteKnowledgeRecycle(row.id);
  ElMessage.success('彻底删除成功');
  handleRefresh();
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
    toolbarConfig: { refresh: true },
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
    <ElAlert
      class="!mb-3"
      :closable="false"
      show-icon
      title="恢复时会保留此前单独删除的子项；彻底删除后无法恢复。"
      type="warning"
    />
    <!-- 列表 -->
    <Grid>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '恢复',
              type: 'primary',
              link: true,
              popConfirm: {
                title: `确认恢复“${row.name}”吗？`,
                confirm: handleRestore.bind(null, row),
              },
            },
            {
              label: '彻底删除',
              type: 'danger',
              link: true,
              popConfirm: {
                title: `彻底删除后不可恢复，确认删除“${row.name}”吗？`,
                confirm: handlePermanentDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
