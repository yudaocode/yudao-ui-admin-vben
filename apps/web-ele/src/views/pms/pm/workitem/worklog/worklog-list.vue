<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsWorkItemWorkLogApi } from '#/api/pms/pm/workitem/worklog';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElButton, ElDivider, ElSpace } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getWorkItemWorkLogSummary } from '#/api/pms/pm/workitem/worklog';
import { formatWorkHours } from '#/views/pms/pm/utils/format';

import { useColumns } from './data';
import WorkLogForm from './worklog-form.vue';

defineOptions({ name: 'PmsWorkItemWorkLogList' });

// TODO @AI：登记/编辑操作对齐 TableAction，不要手写 Button。补 destroyOnClose。

const props = withDefaults(
  defineProps<{
    editable: boolean;
    showTitle?: boolean;
    workItemId: number;
  }>(),
  { showTitle: true },
);

const emit = defineEmits<{ changed: [] }>(); // 定义 changed 事件，用于工时变化后的回调

const summary = ref<PmsWorkItemWorkLogApi.WorkItemWorkLogSummary>({
  actualHours: 0,
  records: [],
}); // 工时汇总

const [WorkLogFormModal, workLogFormModalApi] = useVbenModal({
  connectedComponent: WorkLogForm,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(props.editable),
    maxHeight: 260,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          summary.value = await getWorkItemWorkLogSummary(props.workItemId);
          return {
            list: summary.value.records,
            total: summary.value.records.length,
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
  } as VxeTableGridOptions<PmsWorkItemWorkLogApi.WorkItemWorkLog>,
});

/** 打开工时表单 */
function openForm(id?: number) {
  workLogFormModalApi
    .setData({
      workItemId: props.workItemId,
      id,
      remainingHours: summary.value.remainingHours,
    })
    .open();
}

/** 处理工时表单提交成功 */
async function handleFormSuccess() {
  await gridApi.query();
  emit('changed');
}

/** 监听工作项变化并刷新工时汇总 */
watch(
  () => props.workItemId,
  () => gridApi.query(),
);
</script>

<template>
  <div>
    <ElDivider v-if="showTitle" content-position="left">工时记录</ElDivider>
    <!-- 工时汇总 -->
    <div class="mb-3 flex items-center justify-between">
      <ElSpace :size="24">
        <span>预估：{{ formatWorkHours(summary.estimatedHours) }}</span>
        <span>已登记：{{ formatWorkHours(summary.actualHours) }}</span>
        <span>剩余：{{ formatWorkHours(summary.remainingHours) }}</span>
      </ElSpace>
      <ElButton
        v-if="editable"
        v-access:code="['pms:pm:work-item:update']"
        plain
        type="primary"
        @click="openForm()"
      >
        登记工时
      </ElButton>
    </div>

    <!-- 工时列表 -->
    <Grid>
      <template #action="{ row }">
        <ElButton
          v-access:code="['pms:pm:work-item:update']"
          link
          type="primary"
          @click="openForm(row.id)"
        >
          编辑
        </ElButton>
      </template>
    </Grid>

    <!-- 工时登记表单 -->
    <WorkLogFormModal @success="handleFormSuccess" />
  </div>
</template>
