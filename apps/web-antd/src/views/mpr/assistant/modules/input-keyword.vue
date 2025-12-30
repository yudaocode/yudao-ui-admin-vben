<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { AssistantApi } from '#/api/mpr/assistant';

import { reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Tag } from 'ant-design-vue';

import { updateAssistantConfig } from '#/api/mpr/assistantConfig';

const props = defineProps<{
  assistant?: AssistantApi.Assistant;
  assistantConfig?: AssistantApi.AssistantConfig;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const loading = ref(false);

const inputKeywordFormRef = ref();
const rules: Record<string, Rule[]> = {
  keyword: [
    {
      required: true,
      message: '请输入关键词',
      trigger: 'change',
    },
  ],
};
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
  id: props.assistantConfig?.id,
  assistantId: props.assistant?.id,
  keyword: '',
  keywordId: undefined,
});

const recommendedKeywords = ref([
  'iPhone 16 Pro Max',
  'HUAWEI MateTV Pro 85寸',
  'Air Jordan 40 PF "Blue Suede"',
  '特斯拉Model Y 长续航全轮驱动版',
  '诺普男爵小提琴',
]);

function handleTry() {
  inputKeywordFormRef.value
    .validate()
    .then(async () => {
      // 创建关键词，通知下一步
      loading.value = true;
      try {
        /* const data = await createOrGetKeyword({assistantId:formState.id,keyword:formState.keyword});
        formState.keywordId = data;
        await updateAssistant(formState);*/
        await updateAssistantConfig(formState);
        emit('success');
      } finally {
        loading.value = false;
      }
    })
    .catch((error) => {
      console.error('error', error);
    });
}

function handleTag(tag) {
  formState.keyword = tag;
}

/** 动态更新表单值 */
watch(
  () => props.assistantConfig,
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
watch(
  () => props.assistant,
  (val: any) => {
    if (!val) {
      return;
    }
    formState.assistantId = val.id;
  },
  { immediate: true },
);
</script>

<template>
  <Page v-loading="loading">
    <div class="rounded-lg bg-white p-6 shadow-sm">
      <h3 class="mb-4 text-xl font-bold text-gray-800">
        第一步：输入一个关键词
      </h3>
      <p class="mb-6 text-gray-600">您想要助理关注什么类型的商品？</p>

      <div class="mb-6 flex items-center gap-4">
        <a-form
          :model="formState"
          ref="inputKeywordFormRef"
          :rules="rules"
          class="w-full max-w-xl"
        >
          <a-form-item label="" name="keyword">
            <a-input-search
              v-model:value="formState.keyword"
              placeholder="例如：手机、电脑、服装..."
              enter-button="试一下这个关键词"
              size="large"
              @search="handleTry"
            />
          </a-form-item>
        </a-form>
        <Button v-if="false" size="large" type="primary" @click="handleTry">
          试一下这个关键词
        </Button>
      </div>

      <div class="bg-card mb-4 rounded-lg bg-gray-100 p-4 shadow-sm">
        <p class="mb-2 font-bold text-gray-700">推荐关键词</p>
        <div class="flex flex-wrap gap-2">
          <Tag
            class="w-26 cursor-pointer truncate"
            @click="handleTag(tag)"
            :title="tag"
            color="processing"
            v-for="(tag, index) in recommendedKeywords"
            :key="index"
          >
            {{ tag }}
          </Tag>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
/* 可根据需要添加自定义样式 */
</style>
