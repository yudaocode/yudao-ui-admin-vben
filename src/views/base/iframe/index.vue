<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import { computed, ref, unref } from 'vue'
import { Spin } from 'ant-design-vue'
import { useWindowSizeFn } from '@/hooks/event/useWindowSizeFn'
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'
import { useLayoutHeight } from '@/layouts/default/content/useContentViewHeight'

defineProps({
  frameSrc: propTypes.string.def(''),
})

const loading = ref(true)
const topRef = ref(50)
const heightRef = ref(window.innerHeight)
const frameRef = ref<HTMLElement>()
const { headerHeightRef } = useLayoutHeight()

const { prefixCls } = useDesign('iframe-page')
useWindowSizeFn(calcHeight, { wait: 150, immediate: true })

const getWrapStyle = computed((): CSSProperties => {
  return {
    height: `${unref(heightRef)}px`,
  }
})

function calcHeight() {
  const iframe = unref(frameRef)
  if (!iframe)
    return

  const top = headerHeightRef.value
  topRef.value = top
  heightRef.value = window.innerHeight - top
  const clientHeight = document.documentElement.clientHeight - top
  iframe.style.height = `${clientHeight}px`
}

function hideLoading() {
  loading.value = false
  calcHeight()
}
</script>

<template>
  <div :class="prefixCls" :style="getWrapStyle">
    <Spin :spinning="loading" size="large" :style="getWrapStyle">
      <iframe ref="frameRef" :src="frameSrc" :class="`${prefixCls}__main`" @load="hideLoading" />
    </Spin>
  </div>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-iframe-page';

.@{prefix-cls} {
  .ant-spin-nested-loading {
    position: relative;
    height: 100%;

    .ant-spin-container {
      width: 100%;
      height: 100%;
      padding: 10px;
    }
  }

  &__mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  &__main {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--component-background);
    border: 0;
  }
}
</style>
