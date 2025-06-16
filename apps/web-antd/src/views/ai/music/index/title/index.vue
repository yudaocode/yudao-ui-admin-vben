<script lang="ts" setup>
defineOptions({ name: 'AiMusicTitleIndex' });

defineProps({
  title: {
    type: String,
    default: '',
  },
  desc: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <div class="mb-[12px]">
    <div class="flex items-center justify-between" style="color: #303133">
      <span>{{ title }}</span>
      <slot name="extra"></slot>
    </div>
    <div class="my-[8px] text-[12px]" style="color: #909399">
      {{ desc }}
    </div>
    <slot></slot>
  </div>
</template>
