<script lang="ts" setup>
import { Image } from 'ant-design-vue'
import { propTypes } from '@/utils/propTypes'

defineProps({
  fileUrl: propTypes.string.def(''),
  fileName: propTypes.string.def(''),
})
</script>

<template>
  <span class="thumb">
    <Image v-if="fileUrl" :src="fileUrl" :width="104" />
  </span>
</template>

<style lang="less">
.thumb {
  img {
    position: static;
    display: block;
    cursor: zoom-in;
    border-radius: 6px;
    object-fit: cover;
  }
}
</style>
