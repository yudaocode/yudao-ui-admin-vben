<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsWorkItemWorkLogApi } from '#/api/pms/pm/workitem/worklog';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Space } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getWorkItemWorkLogSummary } from '#/api/pms/pm/workitem/worklog';
import { formatWorkHours } from '#/views/pms/pm/utils/format';

import { useColumns } from './data';
import WorkLogForm from './modules/form.vue';

defineOptions({ name: 'PmsWorkItemWorkLogList' });

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
  destroyOnClose: true,
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
    <div v-if="showTitle" class="mb-3 font-semibold">工时记录</div>
    <!-- 工时汇总 -->
    <div class="mb-3 flex items-center justify-between">
      <Space :size="24">
        <span>预估：{{ formatWorkHours(summary.estimatedHours) }}</span>
        <span>已登记：{{ formatWorkHours(summary.actualHours) }}</span>
        <span>剩余：{{ formatWorkHours(summary.remainingHours) }}</span>
      </Space>
      <TableAction
        :actions="[
          {
            label: '登记工时',
            icon: ACTION_ICON.ADD,
            auth: ['pms:pm:work-item:update'],
            ifShow: editable,
            onClick: () => openForm(),
          },
        ]"
      />
    </div>

    <!-- 工时列表 -->
    <Grid>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['pms:pm:work-item:update'],
              ifShow: editable,
              onClick: () => openForm(row.id),
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 工时登记表单 -->
    <WorkLogFormModal @success="handleFormSuccess" />
  </div>
</template>
