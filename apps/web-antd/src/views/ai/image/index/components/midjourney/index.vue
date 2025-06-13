<!-- dall3 -->
<script setup lang="ts">
import type { AiImageApi } from '#/api/ai/image';
import type { AiModelModelApi } from '#/api/ai/model/model';
import type { ImageModelVO, ImageSizeVO } from '#/utils/constants';

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
} from '#/utils/constants';

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
const referImageUrl = ref<any>(); // 参考图
const selectModel = ref<string>('midjourney'); // 选中的模型
const selectSize = ref<string>('1:1'); // 选中 size
const selectVersion = ref<any>('6.0'); // 选中的 version
const versionList = ref<any>(MidjourneyVersions); // version 列表

/** 选择热词 */
const handleHotWordClick = async (hotWord: string) => {
  // 情况一：取消选中
  if (selectHotWord.value === hotWord) {
    selectHotWord.value = '';
    return;
  }

  // 情况二：选中
  selectHotWord.value = hotWord; // 选中
  prompt.value = hotWord; // 设置提示次
};

/** 点击 size 尺寸 */
const handleSizeClick = async (imageSize: ImageSizeVO) => {
  selectSize.value = imageSize.key;
};

/** 点击 model 模型 */
const handleModelClick = async (model: ImageModelVO) => {
  selectModel.value = model.key;
  versionList.value =
    model.key === 'niji' ? NijiVersionList : MidjourneyVersions;
  selectVersion.value = versionList.value[0].value;
};

/** 图片生成 */
const handleGenerateImage = async () => {
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
    ) as ImageSizeVO;
    const req = {
      prompt: prompt.value,
      modelId: matchedModel.id,
      width: imageSize.width,
      height: imageSize.height,
      version: selectVersion.value,
      referImageUrl: referImageUrl.value,
    } as AiImageApi.ImageMidjourneyImagineReqVO;
    await midjourneyImagine(req);
  } finally {
    // 回调
    emits('onDrawComplete', AiPlatformEnum.MIDJOURNEY);
    // 加载结束
    drawIn.value = false;
  }
};

/** 填充值 */
const settingValues = async (detail: AiImageApi.ImageVO) => {
  // 提示词
  prompt.value = detail.prompt;
  // image size
  const imageSize = MidjourneySizeList.find(
    (item) => item.key === `${detail.width}:${detail.height}`,
  ) as ImageSizeVO;
  selectSize.value = imageSize.key;
  // 选中模型
  const model = MidjourneyModels.find(
    (item) => item.key === detail.options?.model,
  ) as ImageModelVO;
  await handleModelClick(model);
  // 版本
  selectVersion.value = versionList.value.find(
    (item: any) => item.value === detail.options?.version,
  ).value;
  // image
  referImageUrl.value = detail.options.referImageUrl;
};

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
  <div class="image-size">
    <div>
      <b>尺寸</b>
    </div>
    <Space wrap class="size-list">
      <div
        class="size-item"
        v-for="imageSize in MidjourneySizeList"
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
        <div class="size-font">{{ imageSize.key }}</div>
      </div>
    </Space>
  </div>
  <div class="model">
    <div>
      <b>模型</b>
    </div>
    <Space wrap class="model-list">
      <div
        :class="
          selectModel === model.key ? 'modal-item selectModel' : 'modal-item'
        "
        v-for="model in MidjourneyModels"
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
  <div class="version">
    <div>
      <b>版本</b>
    </div>
    <Space wrap class="version-list">
      <Select
        v-model:value="selectVersion"
        class="version-select !w-[330px]"
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
  <div class="model">
    <div>
      <b>参考图</b>
    </div>
    <Space wrap class="model-list">
      <ImageUpload v-model:value="referImageUrl" :show-description="false" />
    </Space>
  </div>
  <div class="btns">
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

// version
.version {
  margin-top: 20px;

  .version-list {
    width: 100%;
    margin-top: 20px;
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
      width: 150px;
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
