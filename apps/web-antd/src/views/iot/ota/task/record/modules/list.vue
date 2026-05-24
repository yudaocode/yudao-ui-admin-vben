<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IoTOtaTaskRecordApi } from '#/api/iot/ota/task/record';

import { computed, ref, watch } from 'vue';

import { IoTOtaTaskRecordStatusEnum } from '@vben/constants';

import { Card, message, Tabs } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelOtaTaskRecord,
  getOtaTaskRecordPage,
} from '#/api/iot/ota/task/record';
import { $t } from '#/locales';

import { useGridColumns } from '../data';

const props = defineProps<{
  taskId: number | undefined;
}>();

const emit = defineEmits(['success']);

const activeTab = ref('');

/** 状态标签配置 */
const statusTabs = computed(() => {
  const tabs = [{ key: '', label: '全部设备' }];
  Object.values(IoTOtaTaskRecordStatusEnum).forEach((status) => {
    tabs.push({
      key: status.value.toString(),
      label: status.label,
    });
  });
  return tabs;
});

/** 切换标签 */
async function handleTabChange(tabKey: number | string) {
  activeTab.value = String(tabKey);
  await gridApi.reload();
}

/** 取消单条记录的升级 */
async function handleCancelUpgrade(record: IoTOtaTaskRecordApi.TaskRecord) {
  await cancelOtaTaskRecord(record.id!);
  message.success('取消成功');
  await gridApi.query();
  emit('success');
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 400,
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    pagerConfig: {
      enabled: true,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!props.taskId) {
            return { list: [], total: 0 };
          }
          return await getOtaTaskRecordPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            taskId: props.taskId,
            status:
              activeTab.value === '' ? undefined : Number(activeTab.value),
          });
        },
      },
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<IoTOtaTaskRecordApi.TaskRecord>,
});

/** taskId 变化时重新查询 */
watch(
  () => props.taskId,
  async (val) => {
    if (val) {
      activeTab.value = '';
      await gridApi.reload();
    }
  },
);
</script>

<template>
  <Card title="升级设备记录">
    <Tabs v-model:active-key="activeTab" @change="handleTabChange" class="mb-4">
      <Tabs.TabPane v-for="tab in statusTabs" :key="tab.key" :tab="tab.label" />
    </Tabs>
    <Grid>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.cancel'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['iot:ota-task-record:cancel'],
              ifShow: [
                IoTOtaTaskRecordStatusEnum.PENDING.value,
                IoTOtaTaskRecordStatusEnum.PUSHED.value,
                IoTOtaTaskRecordStatusEnum.UPGRADING.value,
              ].includes(row.status!),
              popConfirm: {
                title: '确认要取消该设备的升级任务吗？',
                confirm: handleCancelUpgrade.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Card>
</template>
