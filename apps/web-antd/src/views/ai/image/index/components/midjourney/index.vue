<!-- dall3 -->
<script setup lang="ts">
import type { AiImageApi } from '#/api/ai/image';
import type { AiModelModelApi } from '#/api/ai/model/model';
import type { ImageModel, ImageSize } from '#/utils';

import { ref } from 'vue';

import { confirm } from '@vben/common-ui';

import {
  Button,
  Image,
  message,
  Select,
  Space,
  Textarea,
} from 'ant-design-vue';

import { midjourneyImagine } from '#/api/ai/image';
import { ImageUpload } from '#/components/upload';
import {
  AiPlatformEnum,
  ImageHotWords,
  MidjourneyModels,
  MidjourneySizeList,
  MidjourneyVersions,
  NijiVersionList,
} from '#/utils';

// 消息弹窗

// 接收父组件传入的模型列表
const props = defineProps({
  models: {
    type: Array<AiModelModelApi.Model>,
    default: () => [] as AiModelModelApi.Model[],
  },
});
const emits = defineEmits(['onDrawStart', 'onDrawComplete']);

// 定义属性
const drawIn = ref<boolean>(false); // 生成中
const selectHotWord = ref<string>(''); // 选中的热词
// 表单
const prompt = ref<string>(''); // 提示词
const referImageUrl = ref<any>(); // 参考图
const selectModel = ref<string>('midjourney'); // 选中的模型
const selectSize = ref<string>('1:1'); // 选中 size
const selectVersion = ref<any>('6.0'); // 选中的 version
const versionList = ref<any>(MidjourneyVersions); // version 列表

/** 选择热词 */
async function handleHotWordClick(hotWord: string) {
  // 情况一：取消选中
  if (selectHotWord.value === hotWord) {
    selectHotWord.value = '';
    return;
  }

  // 情况二：选中
  selectHotWord.value = hotWord; // 选中
  prompt.value = hotWord; // 设置提示次
}

/** 点击 size 尺寸 */
async function handleSizeClick(imageSize: ImageSize) {
  selectSize.value = imageSize.key;
}

/** 点击 model 模型 */
async function handleModelClick(model: ImageModel) {
  selectModel.value = model.key;
  versionList.value =
    model.key === 'niji' ? NijiVersionList : MidjourneyVersions;
  selectVersion.value = versionList.value[0].value;
}

/** 图片生成 */
async function handleGenerateImage() {
  // 从 models 中查找匹配的模型
  const matchedModel = props.models.find(
    (item) =>
      item.model === selectModel.value &&
      item.platform === AiPlatformEnum.MIDJOURNEY,
  );
  if (!matchedModel) {
    message.error('该模型不可用，请选择其它模型');
    return;
  }

  // 二次确认
  await confirm(`确认生成内容?`);
  try {
    // 加载中
    drawIn.value = true;
    // 回调
    emits('onDrawStart', AiPlatformEnum.MIDJOURNEY);
    // 发送请求
    const imageSize = MidjourneySizeList.find(
      (item) => selectSize.value === item.key,
    ) as ImageSize;
    const req = {
      prompt: prompt.value,
      modelId: matchedModel.id,
      width: imageSize.width,
      height: imageSize.height,
      version: selectVersion.value,
      referImageUrl: referImageUrl.value,
    } as AiImageApi.ImageMidjourneyImagineReq;
    await midjourneyImagine(req);
  } finally {
    // 回调
    emits('onDrawComplete', AiPlatformEnum.MIDJOURNEY);
    // 加载结束
    drawIn.value = false;
  }
}

/** 填充值 */
async function settingValues(detail: AiImageApi.Image) {
  // 提示词
  prompt.value = detail.prompt;
  // image size
  const imageSize = MidjourneySizeList.find(
    (item) => item.key === `${detail.width}:${detail.height}`,
  ) as ImageSize;
  selectSize.value = imageSize.key;
  // 选中模型
  const model = MidjourneyModels.find(
    (item) => item.key === detail.options?.model,
  ) as ImageModel;
  await handleModelClick(model);
  // 版本
  selectVersion.value = versionList.value.find(
    (item: any) => item.value === detail.options?.version,
  ).value;
  // image
  referImageUrl.value = detail.options.referImageUrl;
}

/** 暴露组件方法 */
defineExpose({ settingValues });
</script>
<template>
  <div class="prompt">
    <b>画面描述</b>
    <p>建议使用“形容词+动词+风格”的格式，使用“，”隔开.</p>
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
    <Space wrap class="mt-4 flex flex-wrap gap-2">
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
    <div><b>尺寸</b></div>
    <Space wrap class="mt-4 flex w-full flex-wrap gap-2">
      <div
        class="flex cursor-pointer flex-col items-center overflow-hidden"
        v-for="imageSize in MidjourneySizeList"
        :key="imageSize.key"
        @click="handleSizeClick(imageSize)"
      >
        <div
          class="bg-card flex h-12 w-12 items-center justify-center rounded-lg border p-0"
          :class="[
            selectSize === imageSize.key ? 'border-blue-500' : 'border-white',
          ]"
        >
          <div :style="imageSize.style"></div>
        </div>
        <div class="text-sm font-bold text-gray-600">{{ imageSize.key }}</div>
      </div>
    </Space>
  </div>

  <div class="mt-8">
    <div><b>模型</b></div>
    <Space wrap class="mt-4 flex flex-wrap gap-2">
      <div
        v-for="model in MidjourneyModels"
        :key="model.key"
        class="flex max-w-40 cursor-pointer flex-col items-center overflow-hidden"
        :class="[
          selectModel === model.key
            ? 'rounded border-blue-500'
            : 'border-transparent',
        ]"
      >
        <Image
          :preview="false"
          :src="model.image"
          fit="contain"
          @click="handleModelClick(model)"
        />
        <div class="text-sm font-bold text-gray-600">{{ model.name }}</div>
      </div>
    </Space>
  </div>

  <div class="mt-8">
    <div><b>版本</b></div>
    <Space wrap class="mt-5 flex w-full flex-wrap gap-2">
      <Select
        v-model:value="selectVersion"
        class="!w-80"
        clearable
        placeholder="请选择版本"
      >
        <Select.Option
          v-for="item in versionList"
          :key="item.value"
          :value="item.value"
        >
          {{ item.label }}
        </Select.Option>
      </Select>
    </Space>
  </div>

  <div class="mt-8">
    <div><b>参考图</b></div>
    <Space wrap class="mt-4">
      <ImageUpload v-model:value="referImageUrl" :show-description="false" />
    </Space>
  </div>

  <div class="mt-8 flex justify-center">
    <Button
      type="primary"
      size="large"
      shape="round"
      :disabled="prompt.length === 0"
      @click="handleGenerateImage"
    >
      {{ drawIn ? '生成中' : '生成内容' }}
    </Button>
  </div>
</template>
