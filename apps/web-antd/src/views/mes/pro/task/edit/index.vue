<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { Badge, Button, message } from 'ant-design-vue';

import { getGanttTaskList, updateTask } from '#/api/mes/pro/task';

import { GanttChart } from '../components';

const submitting = ref(false); // 批量保存按钮加载态
const taskList = ref<any[]>([]); // 甘特图任务数据
const pendingChanges = ref(new Map<number, any>()); // 待保存的修改 Map<taskId, changeData>

const pendingCount = computed(() => pendingChanges.value.size); // 待保存数量
const ganttHeight = computed(() => window.innerHeight - 220); // 甘特图高度

/** 加载甘特图数据 */
async function loadGanttData() {
  taskList.value = await getGanttTaskList({});
}

/** 任务编辑回调：缓存待保存的修改 */
function handleTaskUpdate(change: any) {
  pendingChanges.value.set(change.id, change);
}

/** 批量保存 */
async function handleSave() {
  if (pendingChanges.value.size === 0) {
    return;
  }
  submitting.value = true;
  try {
    const changes = [...pendingChanges.value.values()];
    await Promise.all(
      changes.map((change) =>
        updateTask({
          duration: change.duration,
          endTime: change.endTime,
          id: change.id,
          startTime: change.startTime,
        }),
      ),
    );
    message.success(`已保存 ${changes.length} 条修改`);
    pendingChanges.value = new Map();
    await loadGanttData();
  } finally {
    submitting.value = false;
  }
}

/** 刷新 */
async function handleRefresh() {
  pendingChanges.value = new Map();
  await loadGanttData();
}

onMounted(loadGanttData);
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【生产】生产排产、工序流转卡"
        url="https://doc.iocoder.cn/mes/pro/schedule-card/"
      />
    </template>

    <div class="mb-3 flex items-center justify-between">
      <span class="text-sm text-gray-500">
        可直接拖拽/拉伸任务条，或双击编辑开始时间和时长，修改后点击「批量保存」
      </span>
      <div class="flex items-center gap-3">
        <Badge :count="pendingCount">
          <Button
            type="primary"
            :disabled="pendingCount === 0"
            :loading="submitting"
            @click="handleSave"
          >
            批量保存
          </Button>
        </Badge>
        <Button @click="handleRefresh">刷新</Button>
      </div>
    </div>
    <GanttChart
      :height="ganttHeight"
      :readonly="false"
      :tasks="taskList"
      @task-update="handleTaskUpdate"
    />
  </Page>
</template>
