<script setup lang="ts">
import type { PropType } from 'vue';

import type { AiImageApi } from '#/api/ai/image';

import { onMounted, ref, toRefs, watch } from 'vue';

import { confirm } from '@vben/common-ui';

import { Button, Card, Image, message } from 'ant-design-vue';

import { AiImageStatusEnum } from '#/utils/constants';

// 消息

const props = defineProps({
  detail: {
    type: Object as PropType<AiImageApi.ImageVO>,
    default: () => ({}),
  },
});
const emits = defineEmits(['onBtnClick', 'onMjBtnClick']);

const cardImageRef = ref<any>(); // 卡片 image ref

/** 处理点击事件  */
const handleButtonClick = async (type: string, detail: AiImageApi.ImageVO) => {
  emits('onBtnClick', type, detail);
};

/** 处理 Midjourney 按钮点击事件  */
const handleMidjourneyBtnClick = async (
  button: AiImageApi.ImageMidjourneyButtonsVO,
) => {
  // 确认窗体
  await confirm(`确认操作 "${button.label} ${button.emoji}" ?`);
  emits('onMjBtnClick', button, props.detail);
};

// emits

/** 监听详情 */
const { detail } = toRefs(props);
watch(detail, async (newVal) => {
  await handleLoading(newVal.status);
});
const loading = ref();
/** 处理加载状态 */
const handleLoading = async (status: number) => {
  // 情况一：如果是生成中，则设置加载中的 loading
  if (status === AiImageStatusEnum.IN_PROGRESS) {
    loading.value = message.loading({
      content: `生成中...`,
    });

    // 情况二：如果已经生成结束，则移除 loading
  } else {
    if (loading.value) setTimeout(loading.value, 100);
  }
};

/** 初始化 */
onMounted(async () => {
  await handleLoading(props.detail.status);
});
</script>
<template>
  <Card body-class="" class="image-card">
    <div class="image-operation">
      <div>
        <Button v-if="detail?.status === AiImageStatusEnum.IN_PROGRESS">
          生成中
        </Button>
        <Button v-else-if="detail?.status === AiImageStatusEnum.SUCCESS">
          已完成
        </Button>
        <Button danger v-else-if="detail?.status === AiImageStatusEnum.FAIL">
          异常
        </Button>
      </div>
      <!-- 操作区 -->
      <div>
        <Button
          class="btn"
          type="text"
          @click="handleButtonClick('download', detail)"
        >
          <span class="icon-[ant-design--download-outlined]"></span>
        </Button>
        <Button
          class="btn"
          type="text"
          @click="handleButtonClick('regeneration', detail)"
        >
          <span class="icon-[ant-design--redo-outlined]"></span>
        </Button>
        <Button
          class="btn"
          type="text"
          @click="handleButtonClick('delete', detail)"
        >
          <span class="icon-[ant-design--delete-outlined]"></span>
        </Button>
        <Button
          class="btn"
          type="text"
          @click="handleButtonClick('more', detail)"
        >
          <span class="icon-[ant-design--more-outlined]"></span>
        </Button>
      </div>
    </div>
    <div class="image-wrapper" ref="cardImageRef">
      <Image class="image" :src="detail?.picUrl" />
      <div v-if="detail?.status === AiImageStatusEnum.FAIL">
        {{ detail?.errorMessage }}
      </div>
    </div>
    <!-- Midjourney 专属操作 -->
    <div class="image-mj-btns">
      <Button
        size="small"
        v-for="(button, index) in detail?.buttons"
        :key="index"
        class="ml-0 mr-[10px] mt-[5px] min-w-[40px]"
        @click="handleMidjourneyBtnClick(button)"
      >
        {{ button.label }}{{ button.emoji }}
      </Button>
    </div>
  </Card>
</template>

<style scoped lang="scss">
.image-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 320px;
  height: auto;
  border-radius: 10px;

  .image-operation {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    .btn {
      //border: 1px solid red;
      padding: 10px;
      margin: 0;
    }
  }

  .image-wrapper {
    flex: 1;
    height: 280px;
    margin-top: 20px;
    overflow: hidden;

    .image {
      width: 100%;
      border-radius: 10px;
    }
  }

  .image-mj-btns {
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    width: 100%;
    margin-top: 5px;
  }
}
</style>
