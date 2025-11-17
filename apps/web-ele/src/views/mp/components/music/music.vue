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
    <el-link
      type="success"
      :underline="false"
      target="_blank"
      :href="hqMusicUrl ? hqMusicUrl : musicUrl"
    >
      <div class="mp-card__body bg-background rounded-sm p-2.5">
        <div class="mp-card__avatar">
          <img :src="thumbMediaUrl" alt="" />
        </div>
        <div class="mp-card__detail">
          <div class="mp-card__title" style="margin-bottom: unset">
            {{ title }}
          </div>
          <div class="mp-card__info" style="height: unset">
            {{ description }}
          </div>
        </div>
      </div>
    </el-link>
  </div>
</template>

<style lang="scss" scoped>
/* 因为 joolun 实现依赖 avue 组件，该页面使用了 card.scss  */
@import url('../msg/card.scss');
</style>
