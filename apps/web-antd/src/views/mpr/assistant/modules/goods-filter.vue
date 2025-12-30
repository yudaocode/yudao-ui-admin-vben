<script lang="ts" setup>
import type { AssistantApi } from '#/api/mpr/assistant';

import { ref, watch } from 'vue';

import { Page, VbenCheckButtonGroup } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { updateAssistantConfig } from '#/api/mpr/assistantConfig';

const props = defineProps<{
  assistant?: AssistantApi.Assistant;
  assistantConfig?: AssistantApi.AssistantConfig;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const loading = ref(false);

const isAutoSelectIntended = ref();

const options = [
  { label: '需要自动选定', value: 1 },
  { label: '暂不需要', value: 0, num: 999 },
];

async function onBtnClick(value) {
  const opt = options.find((o) => o.value === value);
  if (opt) {
    message.success(`点击了按钮${opt.label}，value = ${value}`);
  }
  loading.value = true;
  try {
    const params = {
      assistantId: props.assistant.id,
      isAutoSelectIntended: isAutoSelectIntended.value,
    };
    await updateAssistantConfig(params);

    emit('success');
  } finally {
    loading.value = false;
  }
}
/** 动态更新表单值 */
watch(
  () => props.assistantConfig,
  (val: any) => {
    if (!val) {
      return;
    }
    isAutoSelectIntended.value = val.isAutoSelectIntended;
  },
  { immediate: true },
);
</script>

<template>
  <Page v-loading="loading">
    <div class="rounded-lg bg-white p-6 shadow-sm">
      <!-- 阶段成果标题 -->
      <h3 class="mb-6 text-xl font-bold text-gray-800">
        现在我们已经取得了阶段性成果，下面是依据已有数据的分析结果
      </h3>

      <!-- 数据卡片区域 -->
      <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <!-- 价格区间卡片 -->
        <div class="rounded bg-gray-50 p-4">
          <p class="mb-1 text-sm text-gray-600">价格区间</p>
          <p class="text-lg font-semibold text-gray-800">¥1,280 - ¥4,590</p>
          <p class="text-sm text-gray-600">中位数: ¥2,860</p>
          <p class="text-sm text-gray-600">平均值: ¥2,920</p>
        </div>

        <!-- 卖家资质卡片 -->
        <div class="rounded bg-gray-50 p-4">
          <p class="mb-1 text-sm text-gray-600">卖家资质</p>
          <p class="text-lg font-semibold text-gray-800">1-8 年</p>
          <p class="text-sm text-gray-600">平均年限: 3.5 年</p>
          <p class="text-sm text-gray-600">评分: 4.2-4.9</p>
        </div>

        <!-- 地理分布卡片 -->
        <div class="rounded bg-gray-50 p-4">
          <p class="mb-1 text-sm text-gray-600">地理分布</p>
          <p class="text-lg font-semibold text-gray-800">8 个地区</p>
          <p class="text-sm text-gray-600">主要集中: 广东、浙江</p>
          <p class="text-sm text-gray-600">距离: 3-50km</p>
        </div>
      </div>

      <!-- 自动选品提示区域 -->
      <div class="rounded border border-blue-100 bg-blue-50 p-4">
        <div class="mb-3 flex items-start gap-2">
          <IconifyIcon
            icon="ant-design:robot-filled"
            class="mt-1 size-8 text-blue-500"
          />
          <div>
            <h4 class="text-base font-semibold text-gray-800">
              是否需要自动选定意向商品？
            </h4>
            <p class="text-sm text-gray-600">
              Ara 可以根据您设定的筛选条件，自动为您推荐最符合要求的商品。
            </p>
          </div>
        </div>
        <div class="flex flex-wrap gap-3">
          <VbenCheckButtonGroup
            v-model="isAutoSelectIntended"
            :options="options"
            btn-class="py-5"
            @click="onBtnClick()"
            size="large"
            allow-clear
          />
          <Button v-if="false" size="large" type="primary">需要自动选定</Button>
          <Button v-if="false" size="large">暂不需要</Button>
          <Button type="link" class="mt-3 text-sm font-bold text-black">
            自定义筛选条件>>
          </Button>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
:deep(.vben-button-group.size-large button) {
  padding-top: 20px;
  padding-bottom: 20px;
}
</style>
