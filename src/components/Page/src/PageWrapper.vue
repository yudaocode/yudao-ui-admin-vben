<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import { computed, provide, ref, unref, useAttrs, useSlots, watch } from 'vue'
import { omit } from 'lodash-es'
import { PageHeader } from 'ant-design-vue'
import PageFooter from './PageFooter.vue'
import { useDesign } from '@/hooks/web/useDesign'
import { propTypes } from '@/utils/propTypes'
import { useContentHeight } from '@/hooks/web/useContentHeight'
import { PageWrapperFixedHeightKey } from '@/enums/pageEnum'

defineOptions({ name: 'PageWrapper', inheritAttrs: false })

const props = defineProps({
  title: propTypes.string,
  dense: propTypes.bool,
  ghost: propTypes.bool,
  content: propTypes.string,
  contentStyle: {
    type: Object as PropType<CSSProperties>,
  },
  contentBackground: propTypes.bool.def(true),
  contentFullHeight: propTypes.bool.def(false),
  contentClass: propTypes.string,
  fixedHeight: propTypes.bool,
  upwardSpace: propTypes.oneOfType([propTypes.number, propTypes.string]).def(0),
})
const slots = useSlots()
const attrs = useAttrs()

const wrapperRef = ref(null)
const headerRef = ref(null)
const contentRef = ref(null)
const footerRef = ref(null)
const { prefixCls } = useDesign('page-wrapper')

provide(
  PageWrapperFixedHeightKey,
  computed(() => props.fixedHeight),
)

const getIsContentFullHeight = computed(() => {
  return props.contentFullHeight
})

const getUpwardSpace = computed(() => props.upwardSpace)
const { redoHeight, setCompensation, contentHeight } = useContentHeight(
  getIsContentFullHeight,
  wrapperRef,
  [headerRef, footerRef],
  [contentRef],
  getUpwardSpace,
)
setCompensation({ useLayoutFooter: true, elements: [footerRef] })

const getClass = computed(() => {
  return [
    prefixCls,
    {
      [`${prefixCls}--dense`]: props.dense,
    },
    attrs.class ?? {},
  ]
})

const getHeaderSlots = computed(() => {
  return Object.keys(omit(slots, 'default', 'leftFooter', 'rightFooter', 'headerContent'))
})

const getShowHeader = computed(() => props.content || slots?.headerContent || props.title || getHeaderSlots.value.length)

const getShowFooter = computed(() => slots?.leftFooter || slots?.rightFooter)

const getContentStyle = computed((): CSSProperties => {
  const { contentFullHeight, contentStyle, fixedHeight } = props
  if (!contentFullHeight)
    return { ...contentStyle }

  const height = `${unref(contentHeight)}px`
  return {
    ...contentStyle,
    minHeight: height,
    ...(fixedHeight ? { height } : {}),
  }
})

const getContentClass = computed(() => {
  const { contentBackground, contentClass } = props
  return [
    `${prefixCls}-content`,
    contentClass,
    {
      [`${prefixCls}-content-bg`]: contentBackground,
    },
  ]
})

watch(
  () => [getShowFooter.value],
  () => {
    redoHeight()
  },
  {
    flush: 'post',
    immediate: true,
  },
)
</script>

<template>
  <div ref="wrapperRef" :class="getClass">
    <PageHeader
      v-if="getShowHeader"
      v-bind="omit($attrs, 'class')"
      ref="headerRef"
      style="margin: 1rem; border-radius: 1rem;"
      :ghost="ghost"
      :title="title"
    >
      <template #default>
        <template v-if="content">
          {{ content }}
        </template>
        <slot v-else name="headerContent" />
      </template>
      <template v-for="(item, index) in getHeaderSlots" #[item]="data" :key="index">
        <slot :name="item" v-bind="data || {}" />
      </template>
    </PageHeader>

    <div ref="contentRef" class="overflow-hidden" :class="getContentClass" :style="getContentStyle">
      <slot />
    </div>

    <PageFooter v-if="getShowFooter" ref="footerRef">
      <template #left>
        <slot name="leftFooter" />
      </template>
      <template #right>
        <slot name="rightFooter" />
      </template>
    </PageFooter>
  </div>
</template>

<style lang="less">
@prefix-cls: ~'@{namespace}-page-wrapper';

.@{prefix-cls} {
  position: relative;

  .@{prefix-cls}-content {
    margin: 1rem;
    border-radius: 1rem;
  }

  .ant-page-header {
    &:empty {
      margin: 1rem;
      border-radius: 1rem;
    }
  }

  &-content-bg {
    background-color: var(--component-background);
  }

  &--dense {
    .@{prefix-cls}-content {
      margin: 0;
    }
  }
}
</style>
