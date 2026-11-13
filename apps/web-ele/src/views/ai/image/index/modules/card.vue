<script lang="ts" setup>
import type { AiImageApi } from '#/api/ai/image';

import { computed, ref } from 'vue';

import { confirm } from '@vben/common-ui';
import { AiImageModeEnum, AiImageStatusEnum, DICT_TYPE } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromImageUrl, formatDate } from '@vben/utils';

import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElImage,
  ElMessage,
  ElProgress,
  ElTag,
} from 'element-plus';

import { midjourneyAction } from '#/api/ai/image';
import { DictTag } from '#/components/dict-tag';
import {
  AiImagePlatformEnum,
  isMjGridButton,
  isMjHiddenButton,
  isMjInpaintButton,
} from '#/views/ai/image/constants';

/** AI 绘图：作品卡片（我的作品可操作；公开画廊只读） */
defineOptions({ name: 'AiImageCard' });

const props = withDefaults(
  defineProps<{
    image: AiImageApi.Image;
    scope?: string; // 卡片的来源：mine - 我的作品；public - 公开画廊
  }>(),
  {
    scope: 'mine',
  },
);
const emit = defineEmits<{
  acted: [];
  delete: [image: AiImageApi.Image];
  detail: [image: AiImageApi.Image];
  inpaint: [image: AiImageApi.Image];
  public: [image: AiImageApi.Image];
  regenerate: [image: AiImageApi.Image];
}>();

const imageKey = ref(0); // 图片加载失败时，变更 key 重新加载
const loadError = ref(false); // 图片是否加载失败

/** 图片加载失败：点击重试 */
function handleReload() {
  loadError.value = false;
  imageKey.value++;
}

/** Midjourney 按钮：只在成功后展示；换脸结果没有 U / V；CustomZoom 本期隐藏 */
const buttons = computed<AiImageApi.ImageMidjourneyButton[]>(() => {
  if (props.image.status !== AiImageStatusEnum.SUCCESS) {
    return [];
  }
  return (props.image.midjourneyOptions?.buttons || []).filter(
    (button) => !isMjHiddenButton(button.customId),
  );
});
const gridButtons = computed(() =>
  props.image.mode === AiImageModeEnum.MIDJOURNEY_SWAP_FACE
    ? []
    : buttons.value.filter((button) => isMjGridButton(button.customId)),
);
const gridButtonGroups = computed(() =>
  [
    {
      label: '放大',
      buttons: gridButtons.value.filter((button) =>
        button.customId.includes('::upsample::'),
      ),
    },
    {
      label: '变化',
      buttons: gridButtons.value.filter((button) =>
        button.customId.includes('::variation::'),
      ),
    },
  ].filter((group) => group.buttons.length > 0),
);
const otherButtons = computed(() =>
  buttons.value.filter((button) => !isMjGridButton(button.customId)),
);

/** 重新生成：按钮动作、局部重绘是派生任务，不回填 */
const canRegenerate = computed(
  () =>
    props.image.mode !== AiImageModeEnum.MIDJOURNEY_ACTION &&
    props.image.mode !== AiImageModeEnum.MIDJOURNEY_MODAL &&
    props.image.status !== AiImageStatusEnum.IN_PROGRESS,
);

function getButtonText(button: AiImageApi.ImageMidjourneyButton) {
  return (
    [button.emoji, button.label].filter(Boolean).join(' ') ||
    button.customId.split('::')[2]
  );
}

/** 下载 */
async function handleDownload() {
  await downloadFileFromImageUrl({
    fileName: `ai-image-${props.image.id}.png`,
    source: props.image.picUrl,
  });
}

/** 「更多」下拉：公开、删除，或 Midjourney 按钮 */
function handleCommand(command: number | string) {
  if (command === 'public') {
    emit('public', props.image);
    return;
  }
  if (command === 'delete') {
    emit('delete', props.image);
    return;
  }
  const button = otherButtons.value.find((item) => item.customId === command);
  if (button) {
    handleAction(button);
  }
}

/** 执行 Midjourney 按钮：局部重绘打开蒙版弹窗，其它直接提交 */
const actingId = ref<string>();
async function handleAction(button: AiImageApi.ImageMidjourneyButton) {
  if (isMjInpaintButton(button.customId)) {
    emit('inpaint', props.image);
    return;
  }
  try {
    await confirm(`确认执行「${getButtonText(button)}」？将生成一条新的作品`);
  } catch {
    return;
  }
  actingId.value = button.customId;
  try {
    await midjourneyAction({ id: props.image.id, customId: button.customId });
    ElMessage.success('已提交');
    emit('acted');
  } finally {
    actingId.value = undefined;
  }
}
</script>

<template>
  <div
    class="flex flex-col overflow-hidden rounded-lg border border-solid border-border hover:shadow-md"
  >
    <!-- 图片 -->
    <div class="relative h-[200px] bg-gray-100 dark:bg-gray-800">
      <template v-if="image.status === AiImageStatusEnum.SUCCESS">
        <ElImage
          v-if="image.picUrl && !loadError"
          :key="imageKey"
          :src="image.picUrl"
          :preview-src-list="[image.picUrl]"
          preview-teleported
          fit="cover"
          class="size-full"
          @error="loadError = true"
        />
        <div
          v-else
          class="flex size-full cursor-pointer flex-col items-center justify-center gap-1 text-xs text-gray-500"
          @click="handleReload"
        >
          <IconifyIcon icon="lucide:image-off" class="size-5" />
          图片加载失败，点击重试
        </div>
      </template>
      <div
        v-else-if="image.status === AiImageStatusEnum.IN_PROGRESS"
        class="flex size-full flex-col items-center justify-center gap-2 px-6 text-xs text-gray-500"
      >
        <IconifyIcon
          icon="lucide:loader-circle"
          class="size-5 animate-spin text-primary"
        />
        生成中 {{ image.progress || 0 }}%
        <ElProgress
          :percentage="image.progress || 0"
          :show-text="false"
          :stroke-width="4"
          class="w-full"
        />
        <span v-if="image.midjourneyOptions?.providerStatus">
          {{ image.midjourneyOptions.providerStatus }}
        </span>
      </div>
      <div
        v-else
        class="flex size-full flex-col items-center justify-center gap-1.5 overflow-hidden px-3 text-center text-xs text-red-500"
      >
        <IconifyIcon icon="lucide:circle-x" class="size-5" />
        <span class="line-clamp-4 break-all">
          {{ image.errorMessage || '生成失败' }}
        </span>
      </div>
      <!-- 类型、公开标记：Seedream 与通用模型同为 AI 生图，按平台区分 -->
      <div class="absolute left-2 top-2 flex gap-1">
        <ElTag
          v-if="image.platform === AiImagePlatformEnum.BYTEDANCE"
          type="primary"
          size="small"
        >
          Seedream
        </ElTag>
        <DictTag v-else :type="DICT_TYPE.AI_IMAGE_MODE" :value="image.mode" />
        <ElTag
          v-if="scope === 'mine' && image.publicStatus"
          type="success"
          size="small"
        >
          已公开
        </ElTag>
      </div>
    </div>

    <!-- 信息 -->
    <div class="flex flex-1 flex-col gap-1.5 p-2.5">
      <div
        class="line-clamp-2 min-h-[36px] break-all text-[13px] leading-[18px]"
        :title="image.prompt"
      >
        {{ image.prompt || '（无提示词）' }}
      </div>
      <div
        class="flex items-center justify-between gap-2 text-xs text-gray-500"
      >
        <span class="truncate" :title="image.model">{{ image.model }}</span>
        <span class="flex-shrink-0">
          {{ formatDate(image.createTime, 'MM-DD HH:mm') }}
        </span>
      </div>

      <!-- Midjourney：U / V 宫格（与四宫格位置对应），其它按钮收进「更多」 -->
      <div v-if="scope === 'mine' && gridButtons.length > 0" class="flex gap-2">
        <div
          v-for="group in gridButtonGroups"
          :key="group.label"
          class="flex flex-1 items-center gap-1"
        >
          <span class="text-xs text-gray-500">{{ group.label }}</span>
          <div class="grid flex-1 grid-cols-2 gap-0.5">
            <ElButton
              v-for="button in group.buttons"
              :key="button.customId"
              size="small"
              class="!ml-0 !h-5 !px-0 !text-xs"
              :loading="actingId === button.customId"
              @click="handleAction(button)"
            >
              {{ button.label }}
            </ElButton>
          </div>
        </div>
      </div>

      <!-- 操作：常用的单行展示；公开、Midjourney 其它动作、删除收进「更多」 -->
      <div class="mt-auto flex items-center gap-3 whitespace-nowrap">
        <ElButton
          type="primary"
          link
          size="small"
          class="!ml-0"
          @click="emit('detail', image)"
        >
          详情
        </ElButton>
        <ElButton
          v-if="image.status === AiImageStatusEnum.SUCCESS"
          type="primary"
          link
          size="small"
          class="!ml-0"
          @click="handleDownload"
        >
          下载
        </ElButton>
        <template v-if="scope === 'mine'">
          <ElButton
            v-if="canRegenerate"
            type="primary"
            link
            size="small"
            class="!ml-0"
            @click="emit('regenerate', image)"
          >
            重新生成
          </ElButton>
          <ElDropdown
            v-if="
              image.status !== AiImageStatusEnum.IN_PROGRESS ||
              otherButtons.length > 0
            "
            trigger="click"
            @command="handleCommand"
          >
            <ElButton type="primary" link size="small">
              更多
              <IconifyIcon
                icon="lucide:chevron-down"
                class="ml-0.5 inline-block"
              />
            </ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem
                  v-for="button in otherButtons"
                  :key="button.customId"
                  :command="button.customId"
                >
                  {{ getButtonText(button) }}
                </ElDropdownItem>
                <ElDropdownItem
                  v-if="image.status === AiImageStatusEnum.SUCCESS"
                  command="public"
                  :divided="otherButtons.length > 0"
                >
                  {{ image.publicStatus ? '取消公开' : '公开' }}
                </ElDropdownItem>
                <ElDropdownItem
                  v-if="image.status !== AiImageStatusEnum.IN_PROGRESS"
                  command="delete"
                  :divided="
                    otherButtons.length > 0 ||
                    image.status === AiImageStatusEnum.SUCCESS
                  "
                >
                  <span class="text-red-500">删除</span>
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </template>
      </div>
    </div>
  </div>
</template>
