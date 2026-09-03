<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeRecycleApi } from '#/api/pms/kb/recycle';

import { computed, ref } from 'vue';

import { confirm } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { ElButton, ElMessage, ElTabPane, ElTabs } from 'element-plus';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getKnowledgeContentRecycleDetail,
  getKnowledgeContentRecycleList,
  permanentDeleteKnowledgeRecycle,
  restoreKnowledgeRecycle,
} from '#/api/pms/kb/recycle';
import { PmsKnowledgeObjectType } from '#/views/pms/kb/utils/constants';
import { formatKnowledgeFileSize } from '#/views/pms/kb/utils/format';

import { useRecycleGridColumns } from './data';
import KnowledgeRecycleDetail from './knowledge-recycle-detail.vue';

defineOptions({ name: 'PmsKnowledgeRecyclePanel' });

const props = defineProps<{
  libraryId: number;
}>(); // 组件参数

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const list = ref<PmsKnowledgeRecycleApi.KnowledgeRecycle[]>([]); // 回收站记录列表
const activeType = ref<number>(PmsKnowledgeObjectType.DOCUMENT); // 当前对象类型
const filteredList = computed(() =>
  list.value.filter((record) => record.type === activeType.value),
); // 当前类型的回收站记录
const detail = ref<PmsKnowledgeRecycleApi.KnowledgeRecycleDetail>();

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useRecycleGridColumns(activeType.value),
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          list.value = await getKnowledgeContentRecycleList(props.libraryId);
          return {
            list: filteredList.value,
            total: filteredList.value.length,
          };
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<PmsKnowledgeRecycleApi.KnowledgeRecycle>,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 切换对象类型 */
async function handleTypeChange() {
  // 大小列仅文件类型展示，随页签切换显隐
  gridApi.setGridOptions({
    columns: useRecycleGridColumns(activeType.value),
  });
  // 三种类型由同一次查询返回，切换页签直接复用已查询的数据
  await gridApi.grid.loadData(filteredList.value);
}

/** 恢复回收站记录 */
async function handleRestore(record: PmsKnowledgeRecycleApi.KnowledgeRecycle) {
  try {
    // 恢复的二次确认
    await confirm(`确认恢复“${record.name}”吗？`);
    // 发起恢复
    await restoreKnowledgeRecycle(record.id);
    ElMessage.success('恢复成功');
    // 刷新列表和知识库内容
    handleRefresh();
    emit('success');
  } catch {
  }
}

/** 查看本次删除对象的级联内容 */
async function handleDetail(record: PmsKnowledgeRecycleApi.KnowledgeRecycle) {
  try {
    detail.value = await getKnowledgeContentRecycleDetail(record.id);
  } catch {
  }
}

/** 彻底删除回收站记录 */
async function handlePermanentDelete(
  record: PmsKnowledgeRecycleApi.KnowledgeRecycle,
) {
  try {
    // 删除的二次确认
    await confirm(`彻底删除后不可恢复，确认删除“${record.name}”吗？`);
    // 发起删除
    await permanentDeleteKnowledgeRecycle(record.id);
    ElMessage.success('彻底删除成功');
    // 刷新列表和知识库内容
    detail.value = undefined;
    handleRefresh();
    emit('success');
  } catch {
  }
}

function countByType(type: number) {
  return list.value.filter((record) => record.type === type).length;
}
</script>

<template>
  <div>
    <!-- 回收站详情 -->
    <KnowledgeRecycleDetail
      v-if="detail"
      :detail="detail"
      @back="detail = undefined"
      @permanent-delete="handlePermanentDelete"
      @restore="handleRestore"
    />

    <!-- 回收站列表 -->
    <template v-else>
      <div class="flex items-center justify-between">
        <span class="text-xl font-semibold">最近删除</span>
        <span class="text-xs text-[var(--el-text-color-secondary)]">
          内容最多保留 30 天，之后将被永久删除
        </span>
      </div>
      <!-- 类型筛选 -->
      <ElTabs v-model="activeType" class="mt-3" @tab-change="handleTypeChange">
        <ElTabPane
          :label="`文档 (${countByType(PmsKnowledgeObjectType.DOCUMENT)})`"
          :name="PmsKnowledgeObjectType.DOCUMENT"
        />
        <ElTabPane
          :label="`文件夹 (${countByType(PmsKnowledgeObjectType.FOLDER)})`"
          :name="PmsKnowledgeObjectType.FOLDER"
        />
        <ElTabPane
          :label="`文件 (${countByType(PmsKnowledgeObjectType.FILE)})`"
          :name="PmsKnowledgeObjectType.FILE"
        />
      </ElTabs>
      <!-- 列表 -->
      <Grid>
        <template #name="{ row }">
          <ElButton link type="primary" @click="handleDetail(row)">
            {{ row.name }}
          </ElButton>
        </template>
        <template #fileSize="{ row }">
          {{
            row.fileSize == null ? '-' : formatKnowledgeFileSize(row.fileSize)
          }}
        </template>
        <template #deleteTime="{ row }">
          {{ formatDateTime(row.deleteTime) }}
        </template>
        <template #actions="{ row }">
          <TableAction
            :actions="[
              {
                label: '恢复',
                type: 'primary',
                link: true,
                onClick: handleRestore.bind(null, row),
              },
              {
                label: '彻底删除',
                type: 'danger',
                link: true,
                onClick: handlePermanentDelete.bind(null, row),
              },
            ]"
          />
        </template>
      </Grid>
    </template>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-tabs__item),
:deep(.vxe-table) {
  font-size: 14px;
}
</style>
