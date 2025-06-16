<script setup lang="ts">
import type { PropType } from 'vue';

import type { AiImageApi } from '#/api/ai/image';

import { onMounted, ref, toRefs, watch } from 'vue';

import { confirm } from '@vben/common-ui';

import { Button, Card, Image, message } from 'ant-design-vue';

import { AiImageStatusEnum } from '#/utils';

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
async function handleButtonClick(type: string, detail: AiImageApi.ImageVO) {
  emits('onBtnClick', type, detail);
}

/** 处理 Midjourney 按钮点击事件  */
async function handleMidjourneyBtnClick(
  button: AiImageApi.ImageMidjourneyButtonsVO,
) {
  // 确认窗体
  await confirm(`确认操作 "${button.label} ${button.emoji}" ?`);
  emits('onMjBtnClick', button, props.detail);
}

/** 监听详情 */
const { detail } = toRefs(props);
watch(detail, async (newVal) => {
  await handleLoading(newVal.status);
});
const loading = ref();
/** 处理加载状态 */
async function handleLoading(status: number) {
  // 情况一：如果是生成中，则设置加载中的 loading
  if (status === AiImageStatusEnum.IN_PROGRESS) {
    loading.value = message.loading({
      content: `生成中...`,
    });

    // 情况二：如果已经生成结束，则移除 loading
  } else {
    if (loading.value) setTimeout(loading.value, 100);
  }
}

/** 初始化 */
onMounted(async () => {
  await handleLoading(props.detail.status);
});
</script>
<template>
  <Card
    body-class=""
    class="relative flex h-auto w-[320px] flex-col rounded-[10px]"
  >
    <!-- 图片操作区 -->
    <div class="flex flex-row justify-between">
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
      <div class="flex">
        <Button
          class="m-0 p-[10px]"
          type="text"
          @click="handleButtonClick('download', detail)"
        >
          <span class="icon-[ant-design--download-outlined]"></span>
        </Button>
        <Button
          class="m-0 p-[10px]"
          type="text"
          @click="handleButtonClick('regeneration', detail)"
        >
          <span class="icon-[ant-design--redo-outlined]"></span>
        </Button>
        <Button
          class="m-0 p-[10px]"
          type="text"
          @click="handleButtonClick('delete', detail)"
        >
          <span class="icon-[ant-design--delete-outlined]"></span>
        </Button>
        <Button
          class="m-0 p-[10px]"
          type="text"
          @click="handleButtonClick('more', detail)"
        >
          <span class="icon-[ant-design--more-outlined]"></span>
        </Button>
      </div>
    </div>

    <!-- 图片展示区域 -->
    <div class="mt-[20px] h-[280px] flex-1 overflow-hidden" ref="cardImageRef">
      <Image class="w-full rounded-[10px]" :src="detail?.picUrl" />
      <div v-if="detail?.status === AiImageStatusEnum.FAIL">
        {{ detail?.errorMessage }}
      </div>
    </div>

    <!-- Midjourney 专属操作按钮 -->
    <div class="mt-[5px] flex w-full flex-wrap justify-start">
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
