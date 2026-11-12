<script lang="ts" setup>
import type { AiPptApi } from '#/api/ai/ppt';

import { computed, onBeforeUnmount, ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import {
  AiPptExportFormatEnum,
  AiPptStatusEnum,
  DICT_TYPE,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart, formatDate } from '@vben/utils';

import {
  Alert,
  Button,
  Dropdown,
  message,
  Popover,
  Spin,
  Tag,
  TextArea,
} from 'antdv-next';

import {
  exportPptMy,
  getPpt,
  getPptMy,
  redrawSlideMy,
  updateSlideImageMy,
} from '#/api/ai/ppt';
import { DictTag } from '#/components/dict-tag';

import SlideImage from './slide-image.vue';

/** AI PPT：预览弹窗；用户侧可修改本页、导出，管理端只读 */
defineOptions({ name: 'AiPptPreviewModal' });

const emit = defineEmits<{
  refresh: []; // 任务状态变化（重绘、切换版本），用于刷新列表
}>();

const POLL_INTERVAL = 3000; // 生成中时的刷新间隔
const EXPORT_MENU_ITEMS = [
  { key: AiPptExportFormatEnum.PPTX, label: '导出 PPTX' },
  { key: AiPptExportFormatEnum.PDF, label: '导出 PDF' },
];

const readonly = ref(false); // 只读：管理端使用，没有修改、导出
const loading = ref(false); // 弹窗的加载中
const ppt = ref<AiPptApi.Ppt>(); // PPT 详情
const currentIndex = ref(0); // 当前页（slides 的下标）
const slides = computed<AiPptApi.Slide[]>(() => ppt.value?.slides || []); // 分镜列表
const currentSlide = computed<AiPptApi.Slide | undefined>(
  () => slides.value[currentIndex.value],
);
const isRunning = computed(
  () => ppt.value?.status === AiPptStatusEnum.IN_PROGRESS,
);
const isSlideRedrawing = computed(
  () =>
    isRunning.value &&
    currentSlide.value?.status === AiPptStatusEnum.IN_PROGRESS,
);
const getTitle = computed(() =>
  ppt.value ? `${ppt.value.title} · 预览` : '预览',
);
let pptId: number | undefined; // 当前打开的 PPT 编号
let requestId = 0; // 请求序号：只采用最后一次请求的结果

const [Modal, modalApi] = useVbenModal({
  footer: false,
  async onOpenChange(isOpen: boolean) {
    // 关闭：停止轮询
    if (!isOpen) {
      stopPolling();
      editDrawerApi.close();
      pptId = undefined;
      return;
    }
    const data = modalApi.getData() as { id: number; readonly?: boolean };
    if (!data?.id) {
      return;
    }
    pptId = data.id;
    readonly.value = !!data.readonly;
    ppt.value = undefined;
    currentIndex.value = 0;
    await getDetail();
    // 加载期间已关闭（或卸载）时，不再开始轮询
    if (pptId === data.id) {
      startPolling();
    }
  },
});

/** 加载详情；silent 为 true 时不显示加载状态（轮询使用） */
async function getDetail(silent = false) {
  if (!pptId) {
    return;
  }
  const currentRequestId = ++requestId;
  if (!silent) {
    loading.value = true;
  }
  try {
    const data = readonly.value ? await getPpt(pptId) : await getPptMy(pptId);
    if (currentRequestId !== requestId || !pptId) {
      return;
    }
    const wasRunning = isRunning.value;
    ppt.value = data;
    if (currentIndex.value >= slides.value.length) {
      currentIndex.value = Math.max(slides.value.length - 1, 0);
    }
    // 轮询到结束：通知列表刷新
    if (wasRunning && !isRunning.value) {
      emit('refresh');
    }
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false;
    }
  }
}

/** 本页当前版本的完整提示词：重绘过的取对应版本，否则取分镜的提示词 */
function getCurrentPrompt(slide: AiPptApi.Slide) {
  const image = slide.images?.find((item) => item.url === slide.imageUrl);
  return image?.prompt || slide.imagePrompt;
}

// ========== 修改本页 ==========

const [EditDrawer, editDrawerApi] = useVbenDrawer({
  footer: false,
});
const editPrompt = ref(''); // 编辑中的生图提示词

/** 修改本页：带入本页当前版本的提示词 */
function handleEdit() {
  if (!currentSlide.value) {
    return;
  }
  editPrompt.value = getCurrentPrompt(currentSlide.value);
  editDrawerApi.open();
}

/** 重新生成：异步重绘，任务回到生成中 */
const redrawing = ref(false); // 重绘提交中
async function handleRedraw() {
  if (!ppt.value || !currentSlide.value) {
    return;
  }
  const prompt = editPrompt.value.trim();
  if (!prompt) {
    message.warning('请输入生图提示词');
    return;
  }
  redrawing.value = true;
  try {
    await redrawSlideMy({
      id: ppt.value.id,
      slideIndex: currentSlide.value.index,
      prompt,
    });
    message.success('已提交重绘');
    emit('refresh');
    await getDetail(true);
  } finally {
    redrawing.value = false;
  }
}

/** 切换历史版本：立即设为当前，不重新生成 */
async function handleSwitchImage(image: AiPptApi.SlideImage) {
  if (
    !ppt.value ||
    !currentSlide.value ||
    image.url === currentSlide.value.imageUrl
  ) {
    return;
  }
  if (isRunning.value) {
    message.warning('任务生成中，请稍后再切换');
    return;
  }
  await updateSlideImageMy({
    id: ppt.value.id,
    slideIndex: currentSlide.value.index,
    imageUrl: image.url,
  });
  message.success('已设为当前版本');
  emit('refresh');
  await getDetail(true);
}

// ========== 导出 ==========

const exporting = ref(false); // 导出中
async function handleExport({ key }: { key: number | string }) {
  if (!ppt.value) {
    return;
  }
  const format = String(key);
  exporting.value = true;
  try {
    const data = await exportPptMy(ppt.value.id, format);
    downloadFileFromBlobPart({
      fileName: `${ppt.value.title}.${format}`,
      source: data,
    });
  } finally {
    exporting.value = false;
  }
}

// ========== 轮询 ==========

let pollTimer: ReturnType<typeof setInterval> | undefined; // 轮询定时器
let polling = false; // 静默轮询是否进行中：上一次未返回时不再发起

/** 开始轮询：任务生成中时，静默刷新详情 */
function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    if (!pptId || !isRunning.value || loading.value || polling) {
      return;
    }
    polling = true;
    try {
      await getDetail(true);
    } finally {
      polling = false;
    }
  }, POLL_INTERVAL);
}

/** 停止轮询 */
function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = undefined;
  }
}

/** 卸载时停止轮询 */
onBeforeUnmount(() => {
  stopPolling();
  pptId = undefined;
});
</script>

<template>
  <Modal :title="getTitle" class="w-[1100px]">
    <Spin :spinning="loading">
      <div class="min-h-[400px]">
        <template v-if="ppt">
          <!-- 工具栏 -->
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 text-[13px]">
              <DictTag :type="DICT_TYPE.AI_PPT_STATUS" :value="ppt.status" />
              <span>{{ ppt.finishCount }} / {{ ppt.slideCount }} 页</span>
              <span v-if="isRunning" class="text-gray-500">
                每 3 秒刷新 · 已生成的页可先看
              </span>
            </div>
            <div class="flex items-center gap-2">
              <Popover
                v-if="currentSlide"
                placement="bottomRight"
                trigger="click"
              >
                <template #content>
                  <div
                    class="max-h-[300px] w-[420px] overflow-y-auto whitespace-pre-wrap break-all text-[13px]"
                  >
                    {{ getCurrentPrompt(currentSlide) }}
                  </div>
                </template>
                <Button size="small">显示提示词</Button>
              </Popover>
              <Button
                v-if="!readonly && currentSlide"
                size="small"
                type="primary"
                ghost
                :disabled="isRunning || !currentSlide.imageUrl"
                @click="handleEdit"
              >
                修改
              </Button>
              <Dropdown
                v-if="!readonly && ppt.status === AiPptStatusEnum.SUCCESS"
                :trigger="['click']"
                :disabled="exporting"
                :menu="{ items: EXPORT_MENU_ITEMS, onClick: handleExport }"
              >
                <Button size="small" type="primary" :loading="exporting">
                  导出
                  <IconifyIcon
                    icon="lucide:chevron-down"
                    class="ml-0.5 inline-block"
                  />
                </Button>
              </Dropdown>
            </div>
          </div>
          <!-- 任务失败原因 -->
          <Alert
            v-if="ppt.status === AiPptStatusEnum.FAIL && ppt.errorMessage"
            type="error"
            show-icon
            class="mb-3"
            :title="`任务已失败：${ppt.errorMessage}`"
            :description="
              readonly ? undefined : '关闭后在列表点「继续生成」补齐'
            "
          />

          <!-- 分镜阶段 -->
          <div
            v-if="slides.length === 0"
            class="flex aspect-video flex-col items-center justify-center gap-2 rounded-md bg-gray-100 text-gray-500 dark:bg-gray-800"
          >
            <template v-if="isRunning">
              <IconifyIcon
                icon="lucide:loader-circle"
                class="size-6 animate-spin text-primary"
              />
              正在生成分镜…
            </template>
            <template v-else>没有分镜</template>
          </div>

          <div v-else class="flex gap-3">
            <!-- 大图 -->
            <div class="min-w-0 flex-1">
              <SlideImage
                v-if="currentSlide"
                :slide="currentSlide"
                :running="isRunning"
                preview
              />
              <div
                v-if="
                  currentSlide?.status === AiPptStatusEnum.FAIL &&
                  currentSlide.errorMessage
                "
                class="mt-2 text-xs text-red-500"
              >
                本页最近一次生成失败：{{ currentSlide.errorMessage }}
              </div>
              <div class="mt-2.5 flex items-center justify-center gap-4">
                <Button
                  shape="circle"
                  size="small"
                  :disabled="currentIndex <= 0"
                  @click="currentIndex--"
                >
                  <template #icon>
                    <IconifyIcon
                      icon="lucide:chevron-left"
                      class="inline-block"
                    />
                  </template>
                </Button>
                <span class="text-[13px]">
                  第 {{ currentIndex + 1 }} / {{ slides.length }} 页
                </span>
                <Button
                  shape="circle"
                  size="small"
                  :disabled="currentIndex >= slides.length - 1"
                  @click="currentIndex++"
                >
                  <template #icon>
                    <IconifyIcon
                      icon="lucide:chevron-right"
                      class="inline-block"
                    />
                  </template>
                </Button>
              </div>
            </div>
            <!-- 缩略图 -->
            <div class="max-h-[560px] w-40 flex-shrink-0 overflow-y-auto pr-1">
              <div
                v-for="(slide, index) in slides"
                :key="slide.index"
                class="relative mb-2 cursor-pointer overflow-hidden rounded border-2 border-solid"
                :class="
                  index === currentIndex
                    ? 'border-primary'
                    : 'border-transparent hover:border-border'
                "
                @click="currentIndex = index"
              >
                <SlideImage :slide="slide" :running="isRunning" />
                <span
                  class="absolute left-1 top-1 rounded-sm bg-black/50 px-1 text-xs text-white"
                >
                  {{ slide.index }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </Spin>

    <!-- 修改本页 -->
    <EditDrawer :title="`修改第 ${currentSlide?.index} 页`" class="w-[460px]">
      <template v-if="currentSlide">
        <SlideImage :slide="currentSlide" :running="isRunning" />
        <div
          v-if="
            currentSlide.status === AiPptStatusEnum.FAIL &&
            currentSlide.errorMessage
          "
          class="mt-2 text-xs text-red-500"
        >
          重绘失败：{{
            currentSlide.errorMessage
          }}（当前图未变化，可修改提示词后再试）
        </div>
        <div class="mb-2 mt-4 font-bold">生图提示词</div>
        <TextArea
          v-model:value="editPrompt"
          :rows="8"
          :maxlength="4000"
          show-count
          placeholder="直接修改完整的生图提示词，例如改掉画错的字、换配色"
        />
        <div class="mt-1.5 text-xs leading-[18px] text-gray-500">
          按修改后的提示词重新文生图，不参考当前图，构图可能整体变化；不满意可在下方切回历史版本
        </div>
        <Button
          type="primary"
          block
          class="mt-3"
          :loading="redrawing"
          :disabled="isRunning"
          @click="handleRedraw"
        >
          {{ isSlideRedrawing ? '本页重绘中…' : '重新生成' }}
        </Button>

        <div class="mb-2 mt-5 font-bold">历史版本</div>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="image in currentSlide.images || []"
            :key="image.url"
            class="relative cursor-pointer overflow-hidden rounded border-2 border-solid"
            :class="
              image.url === currentSlide.imageUrl
                ? 'border-primary'
                : 'border-transparent hover:border-border'
            "
            :title="image.prompt"
            @click="handleSwitchImage(image)"
          >
            <img :src="image.url" class="aspect-video w-full object-cover" />
            <Tag
              v-if="image.url === currentSlide.imageUrl"
              color="blue"
              class="absolute right-1 top-1 !mr-0"
            >
              当前
            </Tag>
            <div class="px-1 py-0.5 text-xs text-gray-500">
              {{ formatDate(image.createTime, 'MM-DD HH:mm') }}
            </div>
          </div>
        </div>
      </template>
    </EditDrawer>
  </Modal>
</template>
