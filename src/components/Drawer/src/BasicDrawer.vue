<script lang="ts" setup>
import type { CSSProperties } from 'vue'
import { computed, getCurrentInstance, nextTick, ref, toRaw, unref, watch } from 'vue'
import { Drawer } from 'ant-design-vue'
import type { DrawerInstance, DrawerProps } from './typing'
import DrawerFooter from './components/DrawerFooter.vue'
import DrawerHeader from './components/DrawerHeader.vue'
import { basicProps } from './props'
import { useI18n } from '@/hooks/web/useI18n'
import { deepMerge } from '@/utils'
import { ScrollContainer } from '@/components/Container'
import { isFunction, isNumber } from '@/utils/is'
import { useDesign } from '@/hooks/web/useDesign'
import { useAttrs } from '@/hooks/core/useAttrs'

defineOptions({ inheritAttrs: false })

const props = defineProps(basicProps)
const emit = defineEmits(['openChange', 'ok', 'close', 'register'])

const openRef = ref(false)
const attrs = useAttrs()
const propsRef = ref<Partial<Nullable<DrawerProps>>>(null)

const { t } = useI18n()
const { prefixVar, prefixCls } = useDesign('basic-drawer')

const drawerInstance: DrawerInstance = {
  setDrawerProps,
  emitOpen: undefined,
}

const instance = getCurrentInstance()

instance && emit('register', drawerInstance, instance.uid)

const getMergeProps = computed((): DrawerProps => {
  return deepMerge(toRaw(props), unref(propsRef))
})

const getProps = computed((): DrawerProps => {
  const opt = {
    placement: 'right',
    ...unref(attrs),
    ...unref(getMergeProps),
    open: unref(openRef),
  }
  opt.title = undefined
  const { isDetail, width, wrapClassName, getContainer } = opt
  if (isDetail) {
    if (!width)
      opt.width = '100%'

    const detailCls = `${prefixCls}__detail`
    opt.class = wrapClassName ? `${wrapClassName} ${detailCls}` : detailCls

    if (!getContainer)
      opt.getContainer = `.${prefixVar}-layout-content` as any
  }
  return opt as DrawerProps
})

const getBindValues = computed((): DrawerProps => {
  return {
    ...attrs,
    ...unref(getProps),
  }
})

// Custom implementation of the bottom button,
const getFooterHeight = computed(() => {
  const { footerHeight, showFooter } = unref(getProps)
  if (showFooter && footerHeight)
    return isNumber(footerHeight) ? `${footerHeight}px` : `${footerHeight.replace('px', '')}px`

  return '0px'
})

const getScrollContentStyle = computed((): CSSProperties => {
  const footerHeight = unref(getFooterHeight)
  return {
    position: 'relative',
    height: `calc(100% - ${footerHeight})`,
  }
})

const getLoading = computed(() => {
  return !!unref(getProps)?.loading
})

watch(
  () => props.open,
  (newVal, oldVal) => {
    if (newVal !== oldVal)
      openRef.value = newVal
  },
  { deep: true },
)

watch(
  () => openRef.value,
  (open) => {
    nextTick(() => {
      emit('openChange', open)
      instance && drawerInstance.emitOpen?.(open, instance.uid)
    })
  },
)

// Cancel event
async function onClose(e: Recordable) {
  const { closeFunc } = unref(getProps)
  emit('close', e)
  if (closeFunc && isFunction(closeFunc)) {
    const res = await closeFunc()
    openRef.value = !res
    return
  }
  openRef.value = false
}

function setDrawerProps(props: Partial<DrawerProps>): void {
  // Keep the last setDrawerProps
  propsRef.value = deepMerge(unref(propsRef) || ({} as any), props)

  if (Reflect.has(props, 'open'))
    openRef.value = !!props.open
}

function handleOk() {
  emit('ok')
}
</script>

<template>
  <Drawer :class="prefixCls" v-bind="getBindValues" @close="onClose">
    <template v-if="!$slots.title" #title>
      <DrawerHeader :title="getMergeProps.title as any" :is-detail="isDetail" :show-detail-back="showDetailBack" @close="onClose">
        <template #titleToolbar>
          <slot name="titleToolbar" />
        </template>
      </DrawerHeader>
    </template>
    <template v-else #title>
      <slot name="title" />
    </template>

    <ScrollContainer v-loading="getLoading" :style="getScrollContentStyle" :loading-tip="loadingText || t('common.loadingText')">
      <slot />
    </ScrollContainer>
    <DrawerFooter v-bind="getProps" :height="getFooterHeight" @close="onClose" @ok="handleOk">
      <template v-for="item in Object.keys($slots)" #[item]="data">
        <slot :name="item" v-bind="data || {}" />
      </template>
    </DrawerFooter>
  </Drawer>
</template>

<style lang="less">
@header-height: 60px;
@detail-header-height: 40px;
@prefix-cls: ~'@{namespace}-basic-drawer';
@prefix-cls-detail: ~'@{namespace}-basic-drawer__detail';

.@{prefix-cls} {
  .ant-drawer-wrapper-body {
    overflow: hidden;
  }

  .ant-drawer-body {
    height: calc(100% - @header-height);
    padding: 0;
    background-color: var(--component-background);

    .scrollbar__wrap {
      padding: 16px !important;
      margin-bottom: 0 !important;
    }

    > .scrollbar > .scrollbar__bar.is-horizontal {
      display: none;
    }
  }
}

.@{prefix-cls-detail} {
  position: absolute;

  .ant-drawer-header {
    box-sizing: border-box;
    width: 100%;
    height: @detail-header-height;
    padding: 0;
    border-top: 1px solid;
  }

  .ant-drawer-title {
    height: 100%;
  }

  .ant-drawer-close {
    height: @detail-header-height;
    line-height: @detail-header-height;
  }

  .scrollbar__wrap {
    padding: 0 !important;
  }

  .ant-drawer-body {
    height: calc(100% - @detail-header-height);
  }
}
</style>
