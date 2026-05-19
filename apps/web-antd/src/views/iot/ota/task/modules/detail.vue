<script setup lang="ts">
// TODO @AI：是不是拆分下，task 里面在新建一个 record/modules 里；这样固件、任务、记录，都拆开了，也看起来更清晰。
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IoTOtaTaskApi } from '#/api/iot/ota/task';
import type { IoTOtaTaskRecordApi } from '#/api/iot/ota/task/record';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { formatDate } from '@vben/utils';

import { Card, Descriptions, message, Tabs, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getOtaTask } from '#/api/iot/ota/task';
import {
  cancelOtaTaskRecord,
  getOtaTaskRecordPage,
  getOtaTaskRecordStatusStatistics,
} from '#/api/iot/ota/task/record';
import { IoTOtaTaskRecordStatusEnum } from '#/views/iot/utils/constants';

import { useRecordGridColumns } from '../data';
import UpgradeStatistics from './upgrade-statistics.vue';

/** OTA 任务详情组件 */
defineOptions({ name: 'IoTOtaTaskDetail' });

const emit = defineEmits(['success']);

const taskId = ref<number>();
const taskLoading = ref(false);
const task = ref<IoTOtaTaskApi.Task>({} as IoTOtaTaskApi.Task);

const taskStatisticsLoading = ref(false);
const taskStatistics = ref<Record<string, number>>({});

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

/** 获取任务详情 */
async function getTaskInfo() {
  if (!taskId.value) {
    return;
  }
  taskLoading.value = true;
  try {
    task.value = await getOtaTask(taskId.value);
  } finally {
    taskLoading.value = false;
  }
}

/** 获取统计数据 */
async function getStatistics() {
  if (!taskId.value) {
    return;
  }
  taskStatisticsLoading.value = true;
  try {
    taskStatistics.value = await getOtaTaskRecordStatusStatistics(
      undefined,
      taskId.value,
    );
  } finally {
    taskStatisticsLoading.value = false;
  }
}

/** 切换标签 */
async function handleTabChange(tabKey: number | string) {
  activeTab.value = String(tabKey);
  await gridApi.query();
}

/** 取消升级 */
async function handleCancelUpgrade(record: IoTOtaTaskRecordApi.TaskRecord) {
  await cancelOtaTaskRecord(record.id as number);
  message.success('取消成功');
  await gridApi.query();
  await getStatistics();
  await getTaskInfo();
  emit('success');
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useRecordGridColumns(),
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
          if (!taskId.value) {
            return { list: [], total: 0 };
          }
          return await getOtaTaskRecordPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            taskId: taskId.value,
            status: activeTab.value === '' ? undefined : Number(activeTab.value),
          });
        },
      },
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<IoTOtaTaskRecordApi.TaskRecord>,
});

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData<{ id: number }>();
    if (!data?.id) {
      return;
    }
    taskId.value = data.id;
    activeTab.value = '';
    await Promise.all([getTaskInfo(), getStatistics()]);
    await gridApi.query();
  },
});
</script>

<template>
  <Modal title="升级任务详情" class="w-5/6" :show-cancel-button="false" :show-confirm-button="false">
    <!-- TODO @AI：是不是不用 p-4 外面的？ -->
    <div class="p-4">
      <!-- 任务信息 -->
      <!-- TODO @AI：需要抽成一个小 vue 组件。也使用 description 组件； -->
      <Card title="任务信息" class="mb-5" :loading="taskLoading">
        <Descriptions :column="3" bordered>
          <Descriptions.Item label="任务编号">{{ task.id }}</Descriptions.Item>
          <Descriptions.Item label="任务名称">
            {{ task.name }}
          </Descriptions.Item>
          <Descriptions.Item label="升级范围">
            <Tag>
              {{ getDictLabel(DICT_TYPE.IOT_OTA_TASK_DEVICE_SCOPE, task.deviceScope) }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="任务状态">
            <Tag>
              {{ getDictLabel(DICT_TYPE.IOT_OTA_TASK_STATUS, task.status) }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {{
              task.createTime
                ? formatDate(task.createTime, 'YYYY-MM-DD HH:mm:ss')
                : '-'
            }}
          </Descriptions.Item>
          <Descriptions.Item label="任务描述" :span="3">
            {{ task.description }}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <!-- 任务升级设备统计 -->
      <!-- TODO @AI：和上面有间隙 -->
      <UpgradeStatistics
        :loading="taskStatisticsLoading"
        :statistics="taskStatistics"
      />

      <!-- 设备管理 -->
      <!-- TODO @AI：需要抽成一个小 vue 组件。 -->
      <!-- TODO @AI：和上面有间隙 -->
      <Card title="升级设备记录">
        <Tabs
          v-model:active-key="activeTab"
          @change="handleTabChange"
          class="mb-4"
        >
          <Tabs.TabPane
            v-for="tab in statusTabs"
            :key="tab.key"
            :tab="tab.label"
          />
        </Tabs>
        <Grid>
          <template #actions="{ row }">
            <TableAction
              :actions="[
                {
                  label: '取消',
                  type: 'link',
                  danger: true,
                  icon: ACTION_ICON.DELETE,
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
    </div>
  </Modal>
</template>
