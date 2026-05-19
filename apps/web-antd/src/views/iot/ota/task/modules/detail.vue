<script lang="ts" setup>
import type { IoTOtaTaskApi } from '#/api/iot/ota/task';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { getOtaTask } from '#/api/iot/ota/task';
import { getOtaTaskRecordStatusStatistics } from '#/api/iot/ota/task/record';

import OtaTaskRecordList from '../record/modules/list.vue';
import TaskInfo from './info.vue';
import UpgradeStatistics from './statistics.vue';

const emit = defineEmits(['success']);

const taskId = ref<number>();
const taskLoading = ref(false);
const task = ref<IoTOtaTaskApi.Task>();

const taskStatisticsLoading = ref(false);
const taskStatistics = ref<Record<string, number>>({});

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

/** 单条记录取消后，刷新任务信息和统计 */
async function handleRecordSuccess() {
  await getStatistics();
  await getTaskInfo();
  emit('success');
}

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
    await Promise.all([getTaskInfo(), getStatistics()]);
  },
});
</script>

<template>
  <Modal
    title="升级任务详情"
    class="w-5/6"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <!-- 任务信息 -->
    <TaskInfo :task="task" :loading="taskLoading" />
    <!-- 升级设备统计 -->
    <div class="mt-4">
      <UpgradeStatistics
        :loading="taskStatisticsLoading"
        :statistics="taskStatistics"
      />
    </div>
    <!-- 升级设备记录 -->
    <div class="mt-4">
      <OtaTaskRecordList :task-id="taskId" @success="handleRecordSuccess" />
    </div>
  </Modal>
</template>
