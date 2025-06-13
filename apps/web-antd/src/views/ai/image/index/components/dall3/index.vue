<!-- dall3 -->
<script setup lang="ts">
import type { AiImageApi } from '#/api/ai/image';
import type { AiModelModelApi } from '#/api/ai/model/model';
import type { ImageModelVO, ImageSizeVO } from '#/utils/constants';

import { ref } from 'vue';

import { confirm } from '@vben/common-ui';

import { Button, Image, message, Space, Textarea } from 'ant-design-vue';

import { drawImage } from '#/api/ai/image';
import {
  AiPlatformEnum,
  Dall3Models,
  Dall3SizeList,
  Dall3StyleList,
  ImageHotWords,
} from '#/utils/constants';

// 接收父组件传入的模型列表
const props = defineProps({
  models: {
    type: Array<AiModelModelApi.ModelVO>,
    default: () => [] as AiModelModelApi.ModelVO[],
  },
});
const emits = defineEmits(['onDrawStart', 'onDrawComplete']);

// 定义属性
const prompt = ref<string>(''); // 提示词
const drawIn = ref<boolean>(false); // 生成中
const selectHotWord = ref<string>(''); // 选中的热词
const selectModel = ref<string>('dall-e-3'); // 模型
const selectSize = ref<string>('1024x1024'); // 选中 size
const style = ref<string>('vivid'); // style 样式

/** 选择热词 */
const handleHotWordClick = async (hotWord: string) => {
  // 情况一：取消选中
  if (selectHotWord.value === hotWord) {
    selectHotWord.value = '';
    return;
  }

  // 情况二：选中
  selectHotWord.value = hotWord;
  prompt.value = hotWord;
};

/** 选择 model 模型 */
const handleModelClick = async (model: ImageModelVO) => {
  selectModel.value = model.key;
  // 可以在这里添加模型特定的处理逻辑
  // 例如，如果未来需要根据不同模型设置不同参数
  if (model.key === 'dall-e-3') {
    // DALL-E-3 模型特定的处理
    style.value = 'vivid'; // 默认设置vivid风格
  } else if (model.key === 'dall-e-2') {
    // DALL-E-2 模型特定的处理
    style.value = 'natural'; // 如果有其他DALL-E-2适合的默认风格
  }

  // 更新其他相关参数
  // 例如可以默认选择最适合当前模型的尺寸
  const recommendedSize = Dall3SizeList.find(
    (size) =>
      (model.key === 'dall-e-3' && size.key === '1024x1024') ||
      (model.key === 'dall-e-2' && size.key === '512x512'),
  );

  if (recommendedSize) {
    selectSize.value = recommendedSize.key;
  }
};

/** 选择 style 样式  */
const handleStyleClick = async (imageStyle: ImageModelVO) => {
  style.value = imageStyle.key;
};

/** 选择 size 大小  */
const handleSizeClick = async (imageSize: ImageSizeVO) => {
  selectSize.value = imageSize.key;
};

/**  图片生产  */
const handleGenerateImage = async () => {
  // 从 models 中查找匹配的模型
  const matchedModel = props.models.find(
    (item) =>
      item.model === selectModel.value &&
      item.platform === AiPlatformEnum.OPENAI,
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
    emits('onDrawStart', AiPlatformEnum.OPENAI);
    const imageSize = Dall3SizeList.find(
      (item) => item.key === selectSize.value,
    ) as ImageSizeVO;
    const form = {
      platform: AiPlatformEnum.OPENAI,
      prompt: prompt.value, // 提示词
      modelId: matchedModel.id, // 使用匹配到的模型
      style: style.value, // 图像生成的风格
      width: imageSize.width, // size 不能为空
      height: imageSize.height, // size 不能为空
      options: {
        style: style.value, // 图像生成的风格
      },
    } as AiImageApi.ImageDrawReqVO;
    // 发送请求
    await drawImage(form);
  } finally {
    // 回调
    emits('onDrawComplete', AiPlatformEnum.OPENAI);
    // 加载结束
    drawIn.value = false;
  }
};

/** 填充值 */
const settingValues = async (detail: AiImageApi.ImageVO) => {
  prompt.value = detail.prompt;
  selectModel.value = detail.model;
  style.value = detail.options?.style;
  const imageSize = Dall3SizeList.find(
    (item) => item.key === `${detail.width}x${detail.height}`,
  ) as ImageSizeVO;
  await handleSizeClick(imageSize);
};

/** 暴露组件方法 */
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
        v-for="hotWord in ImageHotWords"
        :key="hotWord"
        @click="handleHotWordClick(hotWord)"
      >
        {{ hotWord }}
      </Button>
    </Space>
  </div>
  <div class="model">
    <div>
      <b>模型选择</b>
    </div>
    <Space wrap class="model-list">
      <div
        :class="
          selectModel === model.key ? 'modal-item selectModel' : 'modal-item'
        "
        v-for="model in Dall3Models"
        :key="model.key"
      >
        <Image
          :preview="false"
          :src="model.image"
          fit="contain"
          @click="handleModelClick(model)"
        />
        <div class="model-font">{{ model.name }}</div>
      </div>
    </Space>
  </div>
  <div class="image-style">
    <div>
      <b>风格选择</b>
    </div>
    <Space wrap class="image-style-list">
      <div
        :class="
          style === imageStyle.key
            ? 'image-style-item selectImageStyle'
            : 'image-style-item'
        "
        v-for="imageStyle in Dall3StyleList"
        :key="imageStyle.key"
      >
        <Image
          :preview="false"
          :src="imageStyle.image"
          fit="contain"
          @click="handleStyleClick(imageStyle)"
        />
        <div class="style-font">{{ imageStyle.name }}</div>
      </div>
    </Space>
  </div>
  <div class="image-size">
    <div>
      <b>画面比例</b>
    </div>
    <Space wrap class="size-list">
      <div
        class="size-item"
        v-for="imageSize in Dall3SizeList"
        :key="imageSize.key"
        @click="handleSizeClick(imageSize)"
      >
        <div
          :class="
            selectSize === imageSize.key
              ? 'size-wrapper selectImageSize'
              : 'size-wrapper'
          "
        >
          <div :style="imageSize.style"></div>
        </div>
        <div class="size-font">{{ imageSize.name }}</div>
      </div>
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
.model {
  margin-top: 30px;

  .model-list {
    margin-top: 15px;

    .modal-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 110px;
      //outline: 1px solid blue;
      overflow: hidden;
      cursor: pointer;
      border: 3px solid transparent;

      .model-font {
        font-size: 14px;
        font-weight: bold;
        color: #3e3e3e;
      }
    }

    .selectModel {
      border: 3px solid #1293ff;
      border-radius: 5px;
    }
  }
}

// 样式 style
.image-style {
  margin-top: 30px;

  .image-style-list {
    margin-top: 15px;

    .image-style-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 110px;
      //outline: 1px solid blue;
      overflow: hidden;
      cursor: pointer;
      border: 3px solid transparent;

      .style-font {
        font-size: 14px;
        font-weight: bold;
        color: #3e3e3e;
      }
    }

    .selectImageStyle {
      border: 3px solid #1293ff;
      border-radius: 5px;
    }
  }
}

// 尺寸
.image-size {
  width: 100%;
  margin-top: 30px;

  .size-list {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    margin-top: 20px;

    .size-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;

      .size-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        padding: 4px;
        background-color: #fff;
        border: 1px solid #fff;
        border-radius: 7px;
      }

      .size-font {
        font-size: 14px;
        font-weight: bold;
        color: #3e3e3e;
      }
    }
  }

  .selectImageSize {
    border: 1px solid #1293ff !important;
  }
}

.btns {
  display: flex;
  justify-content: center;
  margin-top: 50px;
}
</style>
