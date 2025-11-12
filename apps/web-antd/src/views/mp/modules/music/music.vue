<!--
  【微信消息 - 音乐】
-->
<script lang="ts" setup>
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
    <a
      target="_blank"
      :href="hqMusicUrl ? hqMusicUrl : musicUrl"
      style="text-decoration: none"
    >
      <div class="flex rounded-[5px] bg-white p-[10px]">
        <div class="mr-3 h-12 w-12 overflow-hidden rounded-full">
          <img :src="thumbMediaUrl" alt="" class="h-full w-full object-cover" />
        </div>
        <div class="flex-1">
          <div class="text-base text-[rgba(0,0,0,0.85)] hover:text-[#1890ff]">
            {{ title }}
          </div>
          <div class="line-clamp-3 text-[rgba(0,0,0,0.45)]">
            {{ description }}
          </div>
        </div>
      </div>
    </a>
  </div>
</template>

<style scoped></style>
