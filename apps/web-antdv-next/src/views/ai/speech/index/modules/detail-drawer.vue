<script lang="ts" setup>
import type { AiSpeechApi } from '#/api/ai/speech';

import { computed, ref, watch } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { useClipboard } from '@vueuse/core';
import {
  Button,
  Descriptions,
  DescriptionsItem,
  message,
  Spin,
  Tag,
} from 'antdv-next';

import { getSpeechMy } from '#/api/ai/speech';
import {
  AiSpeechStatusEnum,
  AiSpeechStatusLabels,
  canPlaySpeech,
  downloadSpeech,
  formatSpeechSize,
  formatSpeechSpeed,
  getSpeechFormatLabel,
  getSpeechVoiceLabel,
  isSpeechRunning,
} from '#/views/ai/utils/speech';

/** AI 语音：详情抽屉 */
defineOptions({ name: 'AiSpeechDetailDrawer' });

const props = defineProps<{
  latest?: AiSpeechApi.Speech; // 列表轮询拿到的最新结果，用于同步更新详情
}>();

const emit = defineEmits<{
  again: [item: AiSpeechApi.Speech];
  play: [item: AiSpeechApi.Speech];
}>();

const loading = ref(false); // 加载中
const detail = ref<AiSpeechApi.Speech>(); // 详情

const statusColor = computed(() => {
  switch (detail.value?.status) {
    case AiSpeechStatusEnum.FAIL: {
      return 'error';
    }
    case AiSpeechStatusEnum.SUCCESS: {
      return 'success';
    }
    default: {
      return 'processing';
    }
  }
});

let loadSeq = 0; // 加载序号：关闭、重新打开后，作废进行中的请求
let targetId: number | undefined; // 当前打开的语音编号：首次加载过程中，列表轮询的结果也能应用

/** 应用最新结果：成功、失败的终态不被旧的生成中结果覆盖 */
function applyDetail(speech: AiSpeechApi.Speech) {
  if (
    detail.value?.id === speech.id &&
    !isSpeechRunning(detail.value) &&
    isSpeechRunning(speech)
  ) {
    return;
  }
  detail.value = speech;
}

const [Drawer, drawerApi] = useVbenDrawer({
  footer: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      loadSeq++;
      targetId = undefined;
      loading.value = false;
      detail.value = undefined;
      return;
    }
    // 加载数据：只能查看本人的语音
    const data = drawerApi.getData() as { id: number };
    if (!data?.id) {
      return;
    }
    targetId = data.id;
    const seq = ++loadSeq;
    loading.value = true;
    try {
      const speech = await getSpeechMy(data.id);
      // 已关闭或已重新打开：不回填
      if (seq !== loadSeq) {
        return;
      }
      applyDetail(speech);
    } catch {
      if (seq === loadSeq) {
        await drawerApi.close();
      }
    } finally {
      if (seq === loadSeq) {
        loading.value = false;
      }
    }
  },
});

/** 列表轮询拿到新结果时，同步更新详情 */
watch(
  () => props.latest,
  (item) => {
    if (item && item.id === targetId) {
      applyDetail(item);
    }
  },
);

/** 再次生成：带入左侧面板，并关闭抽屉 */
function handleAgain() {
  if (detail.value) {
    emit('again', detail.value);
    drawerApi.close();
  }
}

/** 复制朗读文本 */
const { copy, isSupported } = useClipboard({ legacy: true });
async function handleCopyText() {
  if (!detail.value) {
    return;
  }
  if (!isSupported.value) {
    message.error('复制失败');
    return;
  }
  try {
    await copy(detail.value.inputText);
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
}
</script>

<template>
  <Drawer title="语音详情" class="w-[480px]">
    <Spin :spinning="loading">
      <div class="min-h-[200px]">
        <template v-if="detail">
          <div class="flex flex-wrap items-center gap-2">
            <Tag :color="statusColor" class="!mr-0">
              {{ AiSpeechStatusLabels[detail.status] || '-' }}
            </Tag>
            <Button
              type="primary"
              size="small"
              :disabled="!canPlaySpeech(detail)"
              @click="emit('play', detail)"
            >
              <template #icon>
                <IconifyIcon icon="lucide:play" class="mr-1 inline-block" />
              </template>
              播放
            </Button>
            <Button
              size="small"
              :disabled="!canPlaySpeech(detail)"
              @click="downloadSpeech(detail)"
            >
              <template #icon>
                <IconifyIcon icon="lucide:download" class="mr-1 inline-block" />
              </template>
              下载
            </Button>
            <Button size="small" @click="handleAgain">
              <template #icon>
                <IconifyIcon
                  icon="lucide:rotate-cw"
                  class="mr-1 inline-block"
                />
              </template>
              再次生成
            </Button>
          </div>
          <div
            v-if="detail.status === AiSpeechStatusEnum.FAIL"
            class="mt-2.5 break-all text-xs text-red-500"
          >
            <IconifyIcon
              icon="lucide:circle-alert"
              class="mr-0.5 inline-block align-[-2px]"
            />
            {{ detail.errorMessage || '生成失败' }}
          </div>

          <Descriptions bordered size="small" :column="1" class="mt-4">
            <DescriptionsItem label="平台">
              {{
                getDictLabel(DICT_TYPE.AI_PLATFORM, detail.platform) ||
                detail.platform
              }}
            </DescriptionsItem>
            <DescriptionsItem label="模型">{{ detail.model }}</DescriptionsItem>
            <DescriptionsItem label="音色">
              {{ getSpeechVoiceLabel(detail) }}
            </DescriptionsItem>
            <DescriptionsItem label="音频格式">
              {{ getSpeechFormatLabel(detail.format) }}
            </DescriptionsItem>
            <DescriptionsItem label="语速">
              {{ formatSpeechSpeed(detail.speed) }}
            </DescriptionsItem>
            <DescriptionsItem label="音频大小">
              {{ formatSpeechSize(detail.audioSize) }}
            </DescriptionsItem>
            <DescriptionsItem label="创建时间">
              {{ formatDateTime(detail.createTime) }}
            </DescriptionsItem>
            <DescriptionsItem label="完成时间">
              {{ detail.finishTime ? formatDateTime(detail.finishTime) : '-' }}
            </DescriptionsItem>
          </Descriptions>

          <div class="mb-2 mt-5 flex items-center justify-between">
            <span class="font-bold">朗读文本</span>
            <Button type="link" size="small" @click="handleCopyText">
              <template #icon>
                <IconifyIcon icon="lucide:copy" class="mr-0.5 inline-block" />
              </template>
              复制
            </Button>
          </div>
          <div
            class="max-h-[420px] overflow-y-auto whitespace-pre-wrap break-all rounded bg-gray-50 p-3.5 text-[13px] leading-[22px] dark:bg-gray-800"
          >
            {{ detail.inputText }}
          </div>
        </template>
      </div>
    </Spin>
  </Drawer>
</template>
