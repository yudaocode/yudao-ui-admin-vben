<script lang="ts" setup>
import type { AiDramaStoryboardApi } from '#/api/ai/drama/storyboard';

import { ref } from 'vue';

import { confirm, prompt, useVbenModal } from '@vben/common-ui';
import { AiDramaStatusEnum, DICT_TYPE, isAiDramaRunning } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import { Alert, Button, Input, message, Table, Tag } from 'antdv-next';

import {
  confirmDramaVideoSubmissionFail,
  getDramaVideoSubmissionList,
  resolveDramaVideoSubmission,
  useDramaVideoSubmission,
} from '#/api/ai/drama/storyboard';
import { DictTag } from '#/components/dict-tag';

/** AI 短剧：镜头视频的提交记录；提交结果未知时确认任务编号或确认失败，可恢复提交前的视频 */
defineOptions({ name: 'AiDramaVideoSubmissionDialog' });

const emit = defineEmits<{ success: [] }>();

const loading = ref(false); // 加载中
const storyboard = ref<AiDramaStoryboardApi.Storyboard>();
const list = ref<AiDramaStoryboardApi.VideoSubmission[]>([]);

const columns = [
  { title: '提交时间', key: 'createTime', width: 170 },
  { title: '模型', dataIndex: 'model', key: 'model', width: 140, ellipsis: true },
  { title: '状态', key: 'status', width: 130, align: 'center' as const },
  { title: '任务编号', dataIndex: 'taskId', key: 'taskId', width: 150, ellipsis: true },
  { title: '结果', key: 'result', width: 200 },
  { title: '提交前的视频', key: 'previous', width: 180, align: 'center' as const },
  { title: '操作', key: 'action', width: 180, align: 'center' as const, fixed: 'right' as const },
];

const [Modal, modalApi] = useVbenModal({ footer: false });

/** 提交结果未知：待处理，且没有服务商任务编号 */
function isUnknown(row: AiDramaStoryboardApi.VideoSubmission) {
  return row.status === AiDramaStatusEnum.PENDING && !row.taskId;
}

/** 加载提交记录 */
async function getList() {
  loading.value = true;
  try {
    list.value = await getDramaVideoSubmissionList(storyboard.value!.id);
  } finally {
    loading.value = false;
  }
}

/** 打开弹窗 */
async function open(row: AiDramaStoryboardApi.Storyboard) {
  storyboard.value = row;
  list.value = [];
  modalApi.open();
  await getList();
}
defineExpose({ open });

/** 刷新：同时通知工作台刷新镜头 */
async function refresh() {
  emit('success');
  await getList();
}

/** 填写任务编号 */
async function handleResolve(row: AiDramaStoryboardApi.VideoSubmission) {
  let taskId: string | undefined;
  try {
    taskId = await prompt<string>({
      title: '填写任务编号',
      content: '请输入在服务商控制台核对到的任务编号',
      component: Input,
      componentProps: { placeholder: '任务编号' },
      modelPropName: 'value',
      defaultValue: '',
    });
  } catch {
    return;
  }
  taskId = taskId?.trim();
  if (!taskId) {
    message.warning('任务编号不能为空');
    return;
  }
  await resolveDramaVideoSubmission(row.id, taskId);
  message.success('已改为生成中，稍后自动查询结果');
  await refresh();
}

/** 确认失败 */
async function handleConfirmFail(row: AiDramaStoryboardApi.VideoSubmission) {
  try {
    await confirm('确认已核对服务商没有创建该任务？确认后可重新生成');
  } catch {
    return;
  }
  await confirmDramaVideoSubmissionFail(row.id);
  message.success('已确认失败');
  await refresh();
}

/** 使用此视频、恢复提交前的视频 */
async function handleUse(
  row: AiDramaStoryboardApi.VideoSubmission,
  previous: boolean,
) {
  try {
    await confirm(previous ? '恢复为这次提交前的视频？' : '使用这次提交生成的视频？');
  } catch {
    return;
  }
  await useDramaVideoSubmission(row.id, previous);
  message.success('已更新镜头视频');
  await modalApi.close();
  emit('success');
}
</script>

<template>
  <Modal :title="`提交记录 · #${storyboard?.sceneNo ?? ''}`" class="w-[960px]">
    <Alert
      type="info"
      show-icon
      class="mb-3"
      title="提交结果未知（超时、网络中断）时，服务商可能已创建任务并计费：请到服务商控制台核对，有任务时填写任务编号，没有时确认失败后再重新生成"
    />
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      :scroll="{ x: 'max-content', y: 460 }"
      row-key="id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'createTime'">
          {{ formatDateTime(record.createTime) }}
        </template>
        <template v-else-if="column.key === 'status'">
          <Tag v-if="isUnknown(record as AiDramaStoryboardApi.VideoSubmission)" color="warning">
            结果未知
          </Tag>
          <DictTag v-else :type="DICT_TYPE.AI_DRAMA_STATUS" :value="record.status" />
        </template>
        <template v-else-if="column.key === 'result'">
          <video
            v-if="record.videoUrl"
            :src="record.videoUrl"
            controls
            preload="none"
            class="max-h-[90px] w-40 rounded"
          ></video>
          <div v-if="record.errorMessage" class="text-destructive line-clamp-3 text-xs">
            {{ record.errorMessage }}
          </div>
        </template>
        <template v-else-if="column.key === 'previous'">
          <video
            v-if="record.previousVideo?.videoUrl"
            :src="record.previousVideo.videoUrl"
            controls
            preload="none"
            class="max-h-[90px] w-40 rounded"
          ></video>
          <span v-else class="text-muted-foreground text-xs">无</span>
        </template>
        <template v-else-if="column.key === 'action'">
          <template v-if="isUnknown(record as AiDramaStoryboardApi.VideoSubmission)">
            <Button
              type="link"
              size="small"
              @click="handleResolve(record as AiDramaStoryboardApi.VideoSubmission)"
            >
              填写任务编号
            </Button>
            <Button
              type="link"
              size="small"
              danger
              @click="handleConfirmFail(record as AiDramaStoryboardApi.VideoSubmission)"
            >
              确认失败
            </Button>
          </template>
          <Button
            v-if="
              record.status === AiDramaStatusEnum.SUCCESS &&
              record.videoUrl &&
              record.videoUrl !== storyboard?.videoUrl
            "
            type="link"
            size="small"
            :disabled="isAiDramaRunning(storyboard?.videoStatus)"
            @click="handleUse(record as AiDramaStoryboardApi.VideoSubmission, false)"
          >
            使用此视频
          </Button>
          <Button
            v-if="
              record.previousVideo?.videoUrl &&
              record.previousVideo.videoUrl !== storyboard?.videoUrl
            "
            type="link"
            size="small"
            :disabled="isAiDramaRunning(storyboard?.videoStatus)"
            @click="handleUse(record as AiDramaStoryboardApi.VideoSubmission, true)"
          >
            恢复提交前
          </Button>
        </template>
      </template>
    </Table>
  </Modal>
</template>
