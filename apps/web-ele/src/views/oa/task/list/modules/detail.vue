<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaTaskApi } from '#/api/oa/task';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElButton, ElProgress } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTask } from '#/api/oa/task';
import { useDescription } from '#/components/description';
import { OA_TASK_STATUS } from '#/views/oa/utils/constants';
import { getTaskStatusProgress } from '#/views/oa/utils/format';

import {
  useDetailSchema,
  useLogGridColumns,
  useReceiverGridColumns,
} from '../data';
import FeedbackForm from './feedback-form.vue';

const emit = defineEmits(['success']);

const taskData = ref<OaTaskApi.Task>(); // 任务详情
const detailMode = ref('published'); // 详情场景：published - 我发布的任务；received - 我的任务

/** 是否禁止新增反馈：我的任务中已提交后不能再反馈 */
const feedbackDisabled = computed(() => {
  return (
    detailMode.value !== 'published' &&
    (taskData.value?.receiverStatus ?? OA_TASK_STATUS.NEW) >=
      OA_TASK_STATUS.SUBMITTED
  );
});

const [Descriptions] = useDescription({
  border: true,
  column: 2,
  schema: useDetailSchema(),
});

const [ReceiverGrid, receiverGridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useReceiverGridColumns(),
    data: [],
    minHeight: 120,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<OaTaskApi.TaskReceiver>,
});

const [LogGrid, logGridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useLogGridColumns(),
    data: [],
    minHeight: 120,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<OaTaskApi.TaskLog>,
});

const [FeedbackModal, feedbackModalApi] = useVbenModal({
  connectedComponent: FeedbackForm,
  destroyOnClose: true,
});

/** 加载任务详情 */
async function loadTask(id: number) {
  taskData.value = await getTask(id);
  await nextTick();
  receiverGridApi.grid?.reloadData(taskData.value.receivers || []);
  logGridApi.grid?.reloadData(taskData.value.logs || []);
}

/** 打开反馈表单 */
function handleFeedback() {
  if (!taskData.value || taskData.value.canceled) {
    return;
  }
  feedbackModalApi
    .setData({ task: taskData.value, mode: detailMode.value })
    .open();
}

/** 反馈成功后刷新详情和列表 */
async function handleFeedbackSuccess() {
  emit('success');
  if (taskData.value?.id) {
    await loadTask(taskData.value.id);
  }
}

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      taskData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { id: number; mode: string };
    if (!data?.id) {
      return;
    }
    detailMode.value = data.mode || 'published';
    modalApi.lock();
    try {
      await loadTask(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="任务详情"
    class="w-2/3"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <div class="flex flex-col gap-4">
      <!-- 任务信息 -->
      <div>
        <div class="mb-2 text-base font-bold">任务信息</div>
        <Descriptions :data="taskData">
          <template #description="{ data }">
            <div class="whitespace-pre-wrap">{{ data?.description }}</div>
          </template>
          <template #comment="{ data }">
            <div class="whitespace-pre-wrap">{{ data?.comment || '-' }}</div>
          </template>
        </Descriptions>
        <!-- 总体进度 -->
        <div v-if="taskData" class="mt-4">
          <div class="mb-2 text-sm font-bold">总体进度</div>
          <ElProgress :percentage="getTaskStatusProgress(taskData.status)" />
        </div>
      </div>
      <!-- 接收人状态 -->
      <div>
        <div class="mb-2 text-base font-bold">接收人状态</div>
        <ReceiverGrid>
          <template #statusProgress="{ row }">
            <ElProgress :percentage="getTaskStatusProgress(row.status)" />
          </template>
        </ReceiverGrid>
      </div>
      <!-- 反馈日志 -->
      <div>
        <div class="mb-2 flex items-center justify-between">
          <span class="text-base font-bold">反馈日志</span>
          <ElButton
            v-if="taskData && !taskData.canceled"
            type="primary"
            :disabled="feedbackDisabled"
            @click="handleFeedback"
          >
            新增反馈
          </ElButton>
        </div>
        <LogGrid>
          <template #content="{ row }">
            <div class="whitespace-pre-wrap break-words">{{ row.content }}</div>
          </template>
        </LogGrid>
      </div>
    </div>
  </Modal>
  <FeedbackModal @success="handleFeedbackSuccess" />
</template>
