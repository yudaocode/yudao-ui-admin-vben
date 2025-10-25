<template>
  <div class="diy-editor-placeholder">
    <div class="text-center py-20">
      <h2>DiyEditor 组件</h2>
      <p class="text-gray-500">此组件待实现</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
// 暂时的占位符组件
// TODO: 实现完整的 DiyEditor 功能

interface Props {
  modelValue?: any;
  title?: string;
  libs?: any[];
  previewUrl?: string;
  showNavigationBar?: boolean;
  showPageConfig?: boolean;
  showTabBar?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: any];
  save: [];
  reset: [];
}>();

// 占位符，暂时什么都不做
</script>

<style scoped>
.diy-editor-placeholder {
  min-height: 400px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
