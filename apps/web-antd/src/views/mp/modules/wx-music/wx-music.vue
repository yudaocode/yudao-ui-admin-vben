<!--
  【微信消息 - 音乐】
-->
<script lang="ts" setup>
defineOptions({ name: 'WxMusic' });

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
      <div
        class="avue-card__body"
        style="padding: 10px; background-color: #fff; border-radius: 5px"
      >
        <div class="avue-card__avatar">
          <img :src="thumbMediaUrl" alt="" />
        </div>
        <div class="avue-card__detail">
          <div class="avue-card__title" style="margin-bottom: unset">
            {{ title }}
          </div>
          <div class="avue-card__info" style="height: unset">
            {{ description }}
          </div>
        </div>
      </div>
    </a>
  </div>
</template>

<style lang="scss" scoped>
/** TODO @hw：这里有没办法重构掉哈。辛苦~~~ */

/* 因为 joolun 实现依赖 avue 组件，该页面使用了 card.scss  */
@import url('../wx-msg/card.scss');
</style>
