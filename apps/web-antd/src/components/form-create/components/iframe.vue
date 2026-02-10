<!-- 网页 iframe 组件 (Ant Design Vue 版本) -->
<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

defineOptions({ name: 'IframeComponent' });

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  value: '',
  url: '',
  height: '500px',
  width: '100%',
  frameborder: '0',
  allowfullscreen: true,
  loading: 'lazy',
  sandbox: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'update:value', value: string): void;
}>();

// 接受父组件参数
interface Props {
  modelValue?: string;
  value?: string;
  url?: string;
  height?: string;
  width?: string;
  frameborder?: string;
  allowfullscreen?: boolean;
  loading?: 'eager' | 'lazy';
  sandbox?: string;
  formCreateInject?: any;
}

// 显示的 URL（优先使用 url prop，其次使用 value 或 modelValue）
const displayUrl = computed(() => props.url || props.value || props.modelValue || '');

// 是否显示预览
const showPreview = computed(() => {
  return displayUrl.value && isValidUrl(displayUrl.value);
});

// URL 验证
function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') return false;
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}
</script>

<template>
  <div class="iframe-component">
    <!-- iframe 预览 -->
    <div v-if="showPreview" class="iframe-preview">
      <iframe
        :src="displayUrl"
        :width="width"
        :height="height"
        :frameborder="frameborder"
        :allowfullscreen="allowfullscreen"
        :loading="loading"
        :sandbox="sandbox || undefined"
        class="iframe-content"
      ></iframe>
    </div>

    <!-- 无 URL 或无效 URL 提示 -->
    <div v-else class="iframe-placeholder">
      <a-empty description="请在右侧属性面板配置 URL 地址" />
    </div>
  </div>
</template>

<style scoped>
.iframe-component {
  width: 100%;
}

.iframe-preview {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
}

.iframe-content {
  display: block;
  border: none;
}

.iframe-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  background-color: #fafafa;
}
</style>

