<script lang="ts" setup>
defineOptions({ name: 'WxMusic' })

const props = defineProps({
  title: {
    required: false,
    type: String,
  },
  description: {
    required: false,
    type: String,
  },
  musicUrl: {
    required: false,
    type: String,
  },
  hqMusicUrl: {
    required: false,
    type: String,
  },
  thumbMediaUrl: {
    required: true,
    type: String,
  },
})

defineExpose({
  musicUrl: props.musicUrl,
})
</script>

<template>
  <div>
    <a-button
      type="link"
      :underline="false"
      target="_blank"
      :href="hqMusicUrl ? hqMusicUrl : musicUrl"
    >
      <div
        class="avue-card__body"
        style="padding: 10px; background-color: #fff; border-radius: 5px"
      >
        <div class="avue-card__avatar">
          <img :src="thumbMediaUrl" alt="">
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
    </a-button>
  </div>
</template>
