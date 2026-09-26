<!-- OpenAI / GPT Image / DALL·E -->
<script setup lang="ts">
import type { ImageModel, ImageSize } from '@vben/constants';

import type { AiImageApi } from '#/api/ai/image';
import type { AiModelModelApi } from '#/api/ai/model/model';

import { computed, ref, watch } from 'vue';

import { confirm } from '@vben/common-ui';
import {
  AiPlatformEnum,
  Dall3Models,
  Dall3StyleList,
  getOpenAiImageSizeList,
  ImageHotWords,
  isGptImageModel,
} from '@vben/constants';

import { Button, Image, message, Space, Textarea } from 'ant-design-vue';

import { drawImage } from '#/api/ai/image';

const props = defineProps({
  models: {
    type: Array<AiModelModelApi.Model>,
    default: () => [] as AiModelModelApi.Model[],
  },
}); // 接收父组件传入的模型列表
const emits = defineEmits(['onDrawStart', 'onDrawComplete']);

const prompt = ref<string>('');
const drawIn = ref<boolean>(false);
const selectHotWord = ref<string>('');
const selectModel = ref<string>('');
const selectSize = ref<string>('1024x1024');
const style = ref<string>('vivid');

/** 后台已配置的 OpenAI 图像模型 */
const openaiModels = computed(() =>
  props.models.filter((item) => item.platform === AiPlatformEnum.OPENAI),
);

/**
 * 展示列表：优先用后台配置（可含 gpt-image-2.5-flare 等中转标识）；
 * 未配置时回退到预设，便于提示需要先在「模型配置」里加 IMAGE 模型
 */
const displayModels = computed(() => {
  if (openaiModels.value.length > 0) {
    return openaiModels.value.map((m) => {
      const meta =
        Dall3Models.find((d) => d.key === m.model) ||
        Dall3Models.find(
          (d) =>
            isGptImageModel(m.model) &&
            isGptImageModel(d.key) &&
            d.key === 'gpt-image-2',
        ) ||
        Dall3Models.find(
          (d) => isGptImageModel(m.model) && isGptImageModel(d.key),
        );
      return {
        key: m.model,
        name: m.name || meta?.name || m.model,
        image: meta?.image || `/static/imgs/ai/dall2.jpg`,
      } as ImageModel;
    });
  }
  return Dall3Models;
});

const sizeList = computed(() => getOpenAiImageSizeList(selectModel.value));

/** 仅 DALL·E 3 支持 vivid/natural 风格 */
const showStyle = computed(() => selectModel.value === 'dall-e-3');

watch(
  displayModels,
  (list) => {
    if (list.length === 0) {
      return;
    }
    const exists = list.some((item) => item.key === selectModel.value);
    if (!exists) {
      handleModelClick(list[0]!);
    }
  },
  { immediate: true },
);

async function handleHotWordClick(hotWord: string) {
  if (selectHotWord.value === hotWord) {
    selectHotWord.value = '';
    return;
  }
  selectHotWord.value = hotWord;
  prompt.value = hotWord;
}

async function handleModelClick(model: ImageModel) {
  selectModel.value = model.key;
  if (model.key === 'dall-e-3') {
    style.value = 'vivid';
  } else if (model.key === 'dall-e-2') {
    style.value = 'natural';
  }
  const sizes = getOpenAiImageSizeList(model.key);
  const preferred =
    sizes.find((s) => s.key === '1024x1024') ||
    sizes.find((s) => s.key === '512x512') ||
    sizes[0];
  if (preferred) {
    selectSize.value = preferred.key;
  }
}

async function handleStyleClick(imageStyle: ImageModel) {
  style.value = imageStyle.key;
}

async function handleSizeClick(imageSize: ImageSize) {
  selectSize.value = imageSize.key;
}

async function handleGenerateImage() {
  const matchedModel = openaiModels.value.find(
    (item) => item.model === selectModel.value,
  );
  if (!matchedModel) {
    message.error(
      '该模型未在后台配置。请到「AI 大模型 → 模型配置」新增类型为图像、平台为 OpenAI 的模型（标识填 gpt-image-1 / gpt-image-2 等）',
    );
    return;
  }

  await confirm(`确认生成内容?`);
  try {
    drawIn.value = true;
    emits('onDrawStart', AiPlatformEnum.OPENAI);
    const imageSize = sizeList.value.find(
      (item) => item.key === selectSize.value,
    ) as ImageSize;
    const form = {
      platform: AiPlatformEnum.OPENAI,
      prompt: prompt.value,
      modelId: matchedModel.id,
      width: Number(imageSize.width),
      height: Number(imageSize.height),
      options: showStyle.value ? { style: style.value } : {},
    } as AiImageApi.ImageDrawReqVO;
    await drawImage(form);
  } finally {
    emits('onDrawComplete', AiPlatformEnum.OPENAI);
    drawIn.value = false;
  }
}

async function settingValues(detail: AiImageApi.Image) {
  prompt.value = detail.prompt;
  selectModel.value = detail.model;
  style.value = detail.options?.style || 'vivid';
  const imageSize = getOpenAiImageSizeList(detail.model).find(
    (item) => item.key === `${detail.width}x${detail.height}`,
  );
  if (imageSize) {
    await handleSizeClick(imageSize);
  }
}

defineExpose({ settingValues });
</script>
<template>
  <div class="prompt">
    <b>画面描述</b>
    <p>建议使用"形容词 + 动词 + 风格"的格式，使用"，"隔开</p>
    <Textarea
      v-model:value="prompt"
      :maxlength="1024"
      :rows="5"
      class="mt-4 w-full"
      placeholder="例如：童话里的小屋应该是什么样子？"
      show-count
    />
  </div>

  <div class="mt-8 flex flex-col">
    <div><b>随机热词</b></div>
    <Space wrap class="mt-4 flex flex-wrap justify-start">
      <Button
        shape="round"
        class="m-0"
        :type="selectHotWord === hotWord ? 'primary' : 'default'"
        v-for="hotWord in ImageHotWords"
        :key="hotWord"
        @click="handleHotWordClick(hotWord)"
      >
        {{ hotWord }}
      </Button>
    </Space>
  </div>

  <div class="mt-8">
    <div><b>模型选择</b></div>
    <p v-if="openaiModels.length === 0" class="mt-2 text-xs text-orange-500">
      尚未配置 OpenAI 图像模型，请先在「模型配置」中新增（GPT Image / DALL·E）
    </p>
    <Space wrap class="mt-4 flex flex-wrap gap-2">
      <div
        class="flex w-28 cursor-pointer flex-col items-center overflow-hidden rounded-lg border-2"
        :class="[
          selectModel === model.key ? '!border-blue-500' : 'border-transparent',
        ]"
        v-for="model in displayModels"
        :key="model.key"
      >
        <Image
          :preview="false"
          :src="model.image"
          fit="contain"
          @click="handleModelClick(model)"
        />
        <div class="px-1 text-center text-sm font-bold text-gray-600">
          {{ model.name }}
        </div>
      </div>
    </Space>
  </div>

  <div v-if="showStyle" class="mt-8">
    <div><b>风格选择</b></div>
    <Space wrap class="mt-4 flex flex-wrap gap-2">
      <div
        class="flex w-28 cursor-pointer flex-col items-center overflow-hidden rounded-lg border-2"
        :class="[
          style === imageStyle.key ? 'border-blue-500' : 'border-transparent',
        ]"
        v-for="imageStyle in Dall3StyleList"
        :key="imageStyle.key"
      >
        <Image
          :preview="false"
          :src="imageStyle.image"
          fit="contain"
          @click="handleStyleClick(imageStyle)"
        />
        <div class="text-sm font-bold text-gray-600">
          {{ imageStyle.name }}
        </div>
      </div>
    </Space>
  </div>

  <div class="mt-8 w-full">
    <div><b>画面比例</b></div>
    <Space wrap class="mt-5 flex w-full flex-wrap gap-2">
      <div
        class="flex cursor-pointer flex-col items-center"
        v-for="imageSize in sizeList"
        :key="imageSize.key"
        @click="handleSizeClick(imageSize)"
      >
        <div
          class="flex h-12 w-12 flex-col items-center justify-center rounded-lg border bg-card p-0"
          :class="[
            selectSize === imageSize.key ? 'border-blue-500' : 'border-white',
          ]"
        >
          <div :style="imageSize.style"></div>
        </div>
        <div class="text-sm font-bold text-gray-600">
          {{ imageSize.name }}
        </div>
      </div>
    </Space>
  </div>

  <div class="mt-12 flex justify-center">
    <Button
      type="primary"
      size="large"
      shape="round"
      :loading="drawIn"
      :disabled="prompt.length === 0"
      @click="handleGenerateImage"
    >
      {{ drawIn ? '生成中' : '生成内容' }}
    </Button>
  </div>
</template>
