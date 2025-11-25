<script lang="ts" setup>
import { ElLink } from 'element-plus';
/** 微信消息 - 音乐 */
defineOptions({ name: 'Music' });

const props = defineProps({
  title: {
    required: false,
    type: String,
    default: '',
  },
  description: {
    required: false,
    type: String,
    default: '',
  },
  musicUrl: {
    required: false,
    type: String,
    default: '',
  },
  hqMusicUrl: {
    required: false,
    type: String,
    default: '',
  },
  thumbMediaUrl: {
    required: true,
    type: String,
  },
});

defineExpose({
  musicUrl: props.musicUrl,
});
</script>

<template>
  <div>
    <ElLink
      type="success"
      :underline="false"
      target="_blank"
      :href="hqMusicUrl ? hqMusicUrl : musicUrl"
      class="block"
    >
      <div
        class="bg-background flex items-center rounded-sm border border-[#e8e8e8] p-4 transition hover:border-black/10 hover:shadow-sm"
      >
        <div
          class="mr-3 h-12 w-12 overflow-hidden rounded-full border border-transparent"
        >
          <img :src="thumbMediaUrl" alt="" class="h-full w-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="mb-3 text-base font-medium text-[#000000d9]">
            {{ title }}
          </div>
          <div class="line-clamp-3 h-16 overflow-hidden text-sm text-black/45">
            {{ description }}
          </div>
        </div>
      </div>
    </ElLink>
  </div>
</template>
