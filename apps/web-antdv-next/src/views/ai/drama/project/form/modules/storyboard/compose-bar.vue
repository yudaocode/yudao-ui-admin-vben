<script lang="ts" setup>
import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import { computed, nextTick, ref } from 'vue';

import {
  AiDramaStatusEnum,
  DICT_TYPE,
  isAiDramaRunning,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { formatDate } from '@vben/utils';

import {
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Tag,
  Tooltip,
} from 'antdv-next';

import { DictTag } from '#/components/dict-tag';
import { formatDramaDuration } from '#/views/ai/utils/drama';

import ComposePanel from './compose-panel.vue';

/** AI 短剧：成片条，默认收起；展开后左侧播放成片（待重新合成时为上次成片），右侧为合成设置 */
defineOptions({ name: 'AiDramaComposeBar' });

const props = defineProps<{ detail: AiDramaProjectApi.ProjectDetail }>();
const emit = defineEmits<{ refresh: [] }>();

const expanded = ref(false); // 是否展开
const panelRef = ref<InstanceType<typeof ComposePanel>>();

const project = computed(() => props.detail.project);
/** 有成片文件：重新合成中、合成失败、待重新合成时，上次的成片仍可播放、下载 */
const hasFile = computed(() => !!project.value.composeFileUrl);
/** 待重新合成：上次合成成功后，实际合成输入已变化 */
const stale = computed(
  () =>
    project.value.composeStatus === AiDramaStatusEnum.SUCCESS &&
    !!project.value.composeStale,
);
/** 展示的是上次成片：待重新合成，或重新合成中、失败时仍保留的旧文件 */
const previous = computed(
  () =>
    hasFile.value &&
    (stale.value || project.value.composeStatus !== AiDramaStatusEnum.SUCCESS),
);
const successCount = computed(
  () =>
    props.detail.storyboards.filter(
      (item) => item.videoStatus === AiDramaStatusEnum.SUCCESS && item.videoUrl,
    ).length,
);
/** 摘要：时长 · 画幅 · 镜头数 · 完成时间；没有成片时为合成条件 */
const summary = computed(() => {
  if (!hasFile.value) {
    return `视频已完成 ${successCount.value} / ${props.detail.storyboards.length} 镜`;
  }
  return [
    project.value.composeDuration
      ? formatDramaDuration(project.value.composeDuration)
      : '',
    project.value.composeAspectRatio,
    project.value.composeStoryboardCount
      ? `${project.value.composeStoryboardCount} 镜`
      : '',
    project.value.composeFinishTime
      ? formatDate(project.value.composeFinishTime, 'MM-DD HH:mm')
      : '',
  ]
    .filter(Boolean)
    .join(' · ');
});

/** 展开、收起：展开时按当前镜头重置合成设置 */
async function toggle() {
  expanded.value = !expanded.value;
  if (expanded.value) {
    await nextTick();
    panelRef.value?.reset();
  }
}

/** 下载成片 */
function handleDownload() {
  window.open(project.value.composeFileUrl, '_blank');
}
</script>

<template>
  <Card class="mb-3">
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-base font-medium">
        {{ previous ? '上次成片' : '成片' }}
      </span>
      <Tooltip
        v-if="stale"
        :title="project.composeStaleReason || '合成使用的镜头已变化'"
        placement="top"
      >
        <Tag color="warning">待重新合成</Tag>
      </Tooltip>
      <DictTag
        v-else-if="project.composeStatus"
        :type="DICT_TYPE.AI_DRAMA_STATUS"
        :value="project.composeStatus"
      />
      <Progress
        v-if="isAiDramaRunning(project.composeStatus)"
        :percent="project.composeProgress || 0"
        size="small"
        class="!w-40"
      />
      <span class="text-muted-foreground text-xs">{{ summary }}</span>
      <div class="flex-1"></div>
      <Tag v-if="hasFile && project.publicStatus" color="success">已公开</Tag>
      <Button v-if="hasFile" type="link" @click="handleDownload">下载</Button>
      <Button
        v-if="!expanded"
        type="primary"
        :disabled="successCount < 2"
        @click="toggle"
      >
        {{ project.composeStatus ? '重新合成' : '合成成片' }}
      </Button>
      <Button type="link" @click="toggle">
        {{ expanded ? '收起' : '展开' }}
        <IconifyIcon
          :icon="expanded ? 'lucide:chevron-up' : 'lucide:chevron-down'"
          class="ml-0.5 inline"
        />
      </Button>
    </div>
    <div
      v-if="project.composeStatus === AiDramaStatusEnum.FAIL"
      class="text-destructive mt-1.5 break-all text-xs"
    >
      {{ project.composeErrorMessage || '合成失败' }}
    </div>
    <div
      v-if="!expanded && successCount < 2"
      class="text-muted-foreground mt-1.5 text-xs"
    >
      至少需要 2 个视频已完成的镜头才能合成
    </div>
    <Row v-if="expanded" :gutter="16" class="mt-3">
      <Col :span="10">
        <video
          v-if="hasFile"
          :key="project.composeFileUrl"
          :src="project.composeFileUrl"
          controls
          preload="metadata"
          class="max-h-[360px] w-full rounded-md bg-black"
        ></video>
        <Empty v-else description="还没有成片" />
      </Col>
      <Col :span="14">
        <ComposePanel
          ref="panelRef"
          :detail="detail"
          :hint="stale ? '合成输入已变更' : ''"
          @success="emit('refresh')"
          @refresh="emit('refresh')"
        />
      </Col>
    </Row>
  </Card>
</template>
