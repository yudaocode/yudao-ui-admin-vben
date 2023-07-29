<script lang="ts" setup>
import { computed, unref } from 'vue'
import { useFrameKeepAlive } from './useFrameKeepAlive'
import FramePage from '@/views/base/iframe/index.vue'

defineOptions({ name: 'FrameLayout' })

const { getFramePages, hasRenderFrame, showIframe } = useFrameKeepAlive()

const showFrame = computed(() => unref(getFramePages).length > 0)
</script>

<template>
  <div v-if="showFrame">
    <template v-for="frame in getFramePages" :key="frame.path">
      <FramePage v-if="frame.meta.frameSrc && hasRenderFrame(frame.name)" v-show="showIframe(frame)" :frame-src="frame.meta.frameSrc" />
    </template>
  </div>
</template>
