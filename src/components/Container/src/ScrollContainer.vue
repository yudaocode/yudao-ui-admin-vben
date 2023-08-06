<script lang="ts" setup>
import { nextTick, ref, unref } from 'vue'
import type { ScrollbarType } from '@/components/Scrollbar'
import { Scrollbar } from '@/components/Scrollbar'
import { useScrollTo } from '@/hooks/event/useScrollTo'

defineOptions({ name: 'ScrollContainer' })

const scrollbarRef = ref<Nullable<ScrollbarType>>(null)

/**
 * Scroll to the specified position
 */
function scrollTo(to: number, duration = 500) {
  const scrollbar = unref(scrollbarRef)
  if (!scrollbar)
    return

  nextTick(() => {
    const wrap = unref(scrollbar.wrap)
    if (!wrap)
      return

    const { start } = useScrollTo({
      el: wrap,
      to,
      duration,
    })
    start()
  })
}

function getScrollWrap() {
  const scrollbar = unref(scrollbarRef)
  if (!scrollbar)
    return null

  return scrollbar.wrap
}

/**
 * Scroll to the bottom
 */
function scrollBottom() {
  const scrollbar = unref(scrollbarRef)
  if (!scrollbar)
    return

  nextTick(() => {
    const wrap = unref(scrollbar.wrap) as any
    if (!wrap)
      return

    const scrollHeight = wrap.scrollHeight as number
    const { start } = useScrollTo({
      el: wrap,
      to: scrollHeight,
    })
    start()
  })
}
defineExpose({ scrollbarRef, scrollTo, scrollBottom, getScrollWrap })

//     return {
//       scrollbarRef,
//       scrollTo,
//       scrollBottom,
//       getScrollWrap
//     }
//   }
// })
</script>

<template>
  <Scrollbar ref="scrollbarRef" class="scroll-container" v-bind="$attrs">
    <slot />
  </Scrollbar>
</template>

<style lang="less">
.scroll-container {
  width: 100%;
  height: 100%;

  .scrollbar__wrap {
    margin-bottom: 18px !important;
    overflow-x: hidden;
  }

  .scrollbar__view {
    box-sizing: border-box;
  }
}
</style>
