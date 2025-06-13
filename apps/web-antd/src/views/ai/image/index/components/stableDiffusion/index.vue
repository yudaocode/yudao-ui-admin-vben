<!-- dall3 -->
<script setup lang="ts">
import type { AiImageApi } from '#/api/ai/image';
import type { AiModelModelApi } from '#/api/ai/model/model';

import { ref } from 'vue';

import { alert, confirm } from '@vben/common-ui';

import {
  Button,
  Input,
  InputNumber,
  message,
  Select,
  Space,
  Textarea,
} from 'ant-design-vue';

import { drawImage } from '#/api/ai/image';
import {
  AiPlatformEnum,
  ImageHotEnglishWords,
  StableDiffusionClipGuidancePresets,
  StableDiffusionSamplers,
  StableDiffusionStylePresets,
} from '#/utils/constants';
import { hasChinese } from '#/utils/utils';

// 消息弹窗

// 接收父组件传入的模型列表
const props = defineProps({
  models: {
    type: Array<AiModelModelApi.ModelVO>,
    default: () => [] as AiModelModelApi.ModelVO[],
  },
});
const emits = defineEmits(['onDrawStart', 'onDrawComplete']);

// 定义属性
const drawIn = ref<boolean>(false); // 生成中
const selectHotWord = ref<string>(''); // 选中的热词
// 表单
const prompt = ref<string>(''); // 提示词
const width = ref<number>(512); // 图片宽度
const height = ref<number>(512); // 图片高度
const sampler = ref<string>('DDIM'); // 采样方法
const steps = ref<number>(20); // 迭代步数
const seed = ref<number>(42); // 控制生成图像的随机性
const scale = ref<number>(7.5); // 引导系数
const clipGuidancePreset = ref<string>('NONE'); // 文本提示相匹配的图像(clip_guidance_preset) 简称 CLIP
const stylePreset = ref<string>('3d-model'); // 风格

/** 选择热词 */
const handleHotWordClick = async (hotWord: string) => {
  // 情况一：取消选中
  if (selectHotWord.value === hotWord) {
    selectHotWord.value = '';
    return;
  }

  // 情况二：选中
  selectHotWord.value = hotWord; // 选中
  prompt.value = hotWord; // 替换提示词
};

/** 图片生成 */
const handleGenerateImage = async () => {
  // 从 models 中查找匹配的模型
  const selectModel = 'stable-diffusion-v1-6';
  const matchedModel = props.models.find(
    (item) =>
      item.model === selectModel &&
      item.platform === AiPlatformEnum.STABLE_DIFFUSION,
  );
  if (!matchedModel) {
    message.error('该模型不可用，请选择其它模型');
    return;
  }

  // 二次确认
  if (hasChinese(prompt.value)) {
    alert('暂不支持中文！');
    return;
  }
  await confirm(`确认生成内容?`);

  try {
    // 加载中
    drawIn.value = true;
    // 回调
    emits('onDrawStart', AiPlatformEnum.STABLE_DIFFUSION);
    // 发送请求
    const form = {
      modelId: matchedModel.id,
      prompt: prompt.value, // 提示词
      width: width.value, // 图片宽度
      height: height.value, // 图片高度
      options: {
        seed: seed.value, // 随机种子
        steps: steps.value, // 图片生成步数
        scale: scale.value, // 引导系数
        sampler: sampler.value, // 采样算法
        clipGuidancePreset: clipGuidancePreset.value, // 文本提示相匹配的图像 CLIP
        stylePreset: stylePreset.value, // 风格
      },
    } as unknown as AiImageApi.ImageDrawReqVO;
    await drawImage(form);
  } finally {
    // 回调
    emits('onDrawComplete', AiPlatformEnum.STABLE_DIFFUSION);
    // 加载结束
    drawIn.value = false;
  }
};

/** 填充值 */
const settingValues = async (detail: AiImageApi.ImageVO) => {
  prompt.value = detail.prompt;
  width.value = detail.width;
  height.value = detail.height;
  seed.value = detail.options?.seed;
  steps.value = detail.options?.steps;
  scale.value = detail.options?.scale;
  sampler.value = detail.options?.sampler;
  clipGuidancePreset.value = detail.options?.clipGuidancePreset;
  stylePreset.value = detail.options?.stylePreset;
};

/** 暴露组件方法 */
defineExpose({ settingValues });
</script>
<template>
  <div class="prompt">
    <b>画面描述</b>
    <p>建议使用“形容词 + 动词 + 风格”的格式，使用“，”隔开</p>
    <Textarea
      v-model:value="prompt"
      :maxlength="1024"
      :rows="5"
      class="w-100% mt-[15px]"
      placeholder="例如：童话里的小屋应该是什么样子？"
      show-count
    />
  </div>
  <div class="hot-words">
    <div>
      <b>随机热词</b>
    </div>
    <Space wrap class="word-list">
      <Button
        shape="round"
        class="btn"
        :type="selectHotWord === hotWord ? 'primary' : 'default'"
        v-for="hotWord in ImageHotEnglishWords"
        :key="hotWord"
        @click="handleHotWordClick(hotWord)"
      >
        {{ hotWord }}
      </Button>
    </Space>
  </div>
  <div class="group-item">
    <div>
      <b>采样方法</b>
    </div>
    <Space wrap class="group-item-body">
      <Select
        v-model:value="sampler"
        placeholder="Select"
        size="large"
        class="!w-[330px]"
      >
        <Select.Option
          v-for="item in StableDiffusionSamplers"
          :key="item.key"
          :value="item.key"
        >
          {{ item.name }}
        </Select.Option>
      </Select>
    </Space>
  </div>
  <div class="group-item">
    <div>
      <b>CLIP</b>
    </div>
    <Space wrap class="group-item-body">
      <Select
        v-model:value="clipGuidancePreset"
        placeholder="Select"
        size="large"
        class="!w-[330px]"
      >
        <Select.Option
          v-for="item in StableDiffusionClipGuidancePresets"
          :key="item.key"
          :value="item.key"
        >
          {{ item.name }}
        </Select.Option>
      </Select>
    </Space>
  </div>
  <div class="group-item">
    <div>
      <b>风格</b>
    </div>
    <Space wrap class="group-item-body">
      <Select
        v-model:value="stylePreset"
        placeholder="Select"
        size="large"
        class="!w-[330px]"
      >
        <Select.Option
          v-for="item in StableDiffusionStylePresets"
          :key="item.key"
          :label="item.name"
          :value="item.key"
        >
          {{ item.name }}
        </Select.Option>
      </Select>
    </Space>
  </div>
  <div class="group-item">
    <div>
      <b>图片尺寸</b>
    </div>
    <Space wrap class="group-item-body">
      <Input v-model="width" class="w-[170px]" placeholder="图片宽度" />
      <Input v-model="height" class="w-[170px]" placeholder="图片高度" />
    </Space>
  </div>
  <div class="group-item">
    <div>
      <b>迭代步数</b>
    </div>
    <Space wrap class="group-item-body">
      <InputNumber
        v-model="steps"
        size="large"
        class="!w-[330px]"
        placeholder="Please input"
      />
    </Space>
  </div>
  <div class="group-item">
    <div>
      <b>引导系数</b>
    </div>
    <Space wrap class="group-item-body">
      <InputNumber
        v-model="scale"
        type="number"
        size="large"
        class="!w-[330px]"
        placeholder="Please input"
      />
    </Space>
  </div>
  <div class="group-item">
    <div>
      <b>随机因子</b>
    </div>
    <Space wrap class="group-item-body">
      <InputNumber
        v-model:value="seed"
        size="large"
        class="!w-[330px]"
        placeholder="Please input"
      />
    </Space>
  </div>
  <div class="btns">
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
<style scoped lang="scss">
// 热词
.hot-words {
  display: flex;
  flex-direction: column;
  margin-top: 30px;

  .word-list {
    display: flex;
    flex-flow: row wrap;
    justify-content: start;
    margin-top: 15px;

    .btn {
      margin: 0;
    }
  }
}

// 模型
.group-item {
  margin-top: 30px;

  .group-item-body {
    width: 100%;
    margin-top: 15px;
  }
}

.btns {
  display: flex;
  justify-content: center;
  margin-top: 50px;
}
</style>
