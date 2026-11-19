<script lang="ts" setup>
import type { AiDramaStoryboardApi } from '#/api/ai/drama/storyboard';

import { h, ref } from 'vue';

import { confirm, prompt, useVbenModal } from '@vben/common-ui';
import { AiDramaStatusEnum, DICT_TYPE, isAiDramaRunning } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import {
  ElAlert,
  ElButton,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

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
      component: () => h(ElInput, { placeholder: '任务编号' }),
      modelPropName: 'modelValue',
      defaultValue: '',
    });
  } catch {
    return;
  }
  taskId = taskId?.trim();
  if (!taskId) {
    ElMessage.warning('任务编号不能为空');
    return;
  }
  await resolveDramaVideoSubmission(row.id, taskId);
  ElMessage.success('已改为生成中，稍后自动查询结果');
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
  ElMessage.success('已确认失败');
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
  ElMessage.success('已更新镜头视频');
  await modalApi.close();
  emit('success');
}
</script>

<template>
  <Modal :title="`提交记录 · #${storyboard?.sceneNo ?? ''}`" class="w-[960px]">
    <ElAlert
      type="info"
      show-icon
      :closable="false"
      class="mb-3"
      title="提交结果未知（超时、网络中断）时，服务商可能已创建任务并计费：请到服务商控制台核对，有任务时填写任务编号，没有时确认失败后再重新生成"
    />
    <ElTable v-loading="loading" :data="list" max-height="460" size="small">
      <ElTableColumn label="提交时间" width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.createTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn
        label="模型"
        prop="model"
        width="140"
        show-overflow-tooltip
      />
      <ElTableColumn label="状态" width="130" align="center">
        <template #default="{ row }">
          <ElTag
            v-if="isUnknown(row as AiDramaStoryboardApi.VideoSubmission)"
            type="warning"
          >
            结果未知
          </ElTag>
          <DictTag v-else :type="DICT_TYPE.AI_DRAMA_STATUS" :value="row.status" />
        </template>
      </ElTableColumn>
      <ElTableColumn
        label="任务编号"
        prop="taskId"
        width="150"
        show-overflow-tooltip
      />
      <ElTableColumn label="结果" width="200">
        <template #default="{ row }">
          <video
            v-if="row.videoUrl"
            :src="row.videoUrl"
            controls
            preload="none"
            class="max-h-[90px] w-40 rounded"
          ></video>
          <div
            v-if="row.errorMessage"
            class="text-destructive line-clamp-3 text-xs"
          >
            {{ row.errorMessage }}
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="提交前的视频" width="180" align="center">
        <template #default="{ row }">
          <video
            v-if="row.previousVideo?.videoUrl"
            :src="row.previousVideo.videoUrl"
            controls
            preload="none"
            class="max-h-[90px] w-40 rounded"
          ></video>
          <span v-else class="text-muted-foreground text-xs">无</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <template v-if="isUnknown(row as AiDramaStoryboardApi.VideoSubmission)">
            <ElButton
              type="primary"
              link
              size="small"
              @click="
                handleResolve(row as AiDramaStoryboardApi.VideoSubmission)
              "
            >
              填写任务编号
            </ElButton>
            <ElButton
              type="danger"
              link
              size="small"
              @click="
                handleConfirmFail(row as AiDramaStoryboardApi.VideoSubmission)
              "
            >
              确认失败
            </ElButton>
          </template>
          <ElButton
            v-if="
              row.status === AiDramaStatusEnum.SUCCESS &&
              row.videoUrl &&
              row.videoUrl !== storyboard?.videoUrl
            "
            type="primary"
            link
            size="small"
            :disabled="isAiDramaRunning(storyboard?.videoStatus)"
            @click="
              handleUse(row as AiDramaStoryboardApi.VideoSubmission, false)
            "
          >
            使用此视频
          </ElButton>
          <ElButton
            v-if="
              row.previousVideo?.videoUrl &&
              row.previousVideo.videoUrl !== storyboard?.videoUrl
            "
            type="primary"
            link
            size="small"
            :disabled="isAiDramaRunning(storyboard?.videoStatus)"
            @click="
              handleUse(row as AiDramaStoryboardApi.VideoSubmission, true)
            "
          >
            恢复提交前
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
  </Modal>
</template>
