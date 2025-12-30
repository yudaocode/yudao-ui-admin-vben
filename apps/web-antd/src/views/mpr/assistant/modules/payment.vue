<script lang="ts" setup>
import type { AssistantApi } from '#/api/mpr/assistant';

import { reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Textarea } from 'ant-design-vue';

const props = defineProps<{
  assistant?: AssistantApi.Assistant;
}>();

// eslint-disable-next-line no-unused-vars
const _emit = defineEmits<{
  (e: 'success'): void;
}>();

const loading = ref(false);

const filterPrompt = ref(
  '你是一个二手商品鉴定专家，你是一个二手商品鉴定专家，你是一个二手商品鉴定专家，你是一个二手商品鉴定专家，你是一个二手商品鉴定专家',
);
/** 暴露出表单校验方法和表单值获取方法 */
defineExpose({
  validate: async () => {
    try {
      await inputKeywordFormRef.value.validate();
      return true;
    } catch {
      return false;
    }
  },
  getValues: props.assistant,
});

const formState = reactive({
  id: props.assistant?.id,
  keyword: '',
  keywordId: undefined,
});

/** 动态更新表单值 */
watch(
  () => props.assistant,
  (val: any) => {
    if (!val) {
      return;
    }
    formState.id = val.id;
    formState.keywordId = val.keywordId;
    formState.keyword = val.keyword;
  },
  { immediate: true },
);
const list = ref([
  {
    title: 'iPhone 6 (16 GB) Perfect Shape',
    createTime: '2018-06-20',
    details: {
      seller: { sellerName: 'Sumair Jaffer' },
      images: ['/static/images/Ara.png'],
    },
  },
  {
    title: 'iPhone 16 Pro (Brand new open box)',
    createTime: '2018-05-01',
    details: {
      seller: { sellerName: 'Sumair Jaffer' },
      images: ['/static/images/Ara.png'],
    },
  },
  {
    title: 'iPhone 15 – 128GB | 97% Battery Health | Excellent Condition',
    createTime: '2018-05-20',
    details: {
      seller: { sellerName: 'Sumair Jaffer' },
      images: ['/static/images/Ara.png'],
    },
  },
]);
</script>

<template>
  <Page v-loading="loading">
    <div class="rounded-lg bg-white p-6 shadow-sm">
      <!-- 工作状态提示 -->
      <h3 class="mb-6 text-xl font-bold text-gray-800">
        助理已经开始在开始工作，数据将实时回传........
      </h3>
      <div class="mb-8 h-20 w-full rounded bg-gray-50">
        <a-carousel autoplay dot-position="right" class="h-20 w-full">
          <div class="flex" v-for="(item, index) in list" :key="index">
            <a-flex align="center" justify="space-around">
              <a-image
                src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"
                :width="50"
              />
              <a-flex
                vertical
                align="center"
                justify="space-around"
                :style="{ padding: '2px' }"
              >
                <a-typography>
                  <a-typography-title :level="4">
                    {{ item.title }}
                  </a-typography-title>
                  <a-typography-text>
                    {{ item.details.seller.sellerName }}
                  </a-typography-text>
                </a-typography>
              </a-flex>
            </a-flex>
          </div>
        </a-carousel>
      </div>

      <!-- 数据筛选规则设置 -->
      <div class="mb-6">
        <h4 class="mb-3 text-lg font-semibold text-gray-800">
          设置数据筛选规则
        </h4>
        <div class="mb-2 flex items-center text-sm text-gray-600">
          <IconifyIcon icon="ant-design:info-circle-filled" class="" />
          <span>
            AI提示词:
            系统将自动过滤掉包含测试、临时等干扰商品数据，确保数据的准确性
          </span>
        </div>
        <div class="flex gap-4">
          <Textarea
            type="textarea"
            v-model:value="filterPrompt"
            :rows="3"
            class="flex-1"
            placeholder="输入AI提示词..."
          />
          <Button size="large" type="primary">试试效果</Button>
        </div>
      </div>

      <!-- 筛选结果提示 -->
      <div
        class="flex items-start rounded border border-yellow-200 bg-yellow-50 p-4"
      >
        <IconifyIcon icon="ant-design:warning-filled" class="mr-2 mt-2" />
        <div>
          <p class="font-medium text-gray-800">测试商品A123 被排除</p>
          <p class="text-sm text-gray-600">原因: 商品名称包含"测试"关键词</p>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
:deep(.slick-slide) {
  height: 60px;
  overflow: hidden;
  line-height: 60px;
  text-align: center;
}
</style>
