<script lang="ts" setup>
import { useMenuSetting } from '@/hooks/setting/useMenuSetting'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'PageFooter', inheritAttrs: false })

const { prefixCls } = useDesign('page-footer')
const { getCalcContentWidth } = useMenuSetting()
</script>

<template>
  <div class="fixed bottom-0 right-0 z-99 w-full flex items-center border-t-1 px-6 text-base/44" :style="{ width: getCalcContentWidth }">
    <div class="flex-1-1">
      <slot name="left" />
    </div>
    <slot />
    <div :class="`${prefixCls}__right`">
      <slot name="right" />
    </div>
  </div>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{namespace}-page-footer';

.@{prefix-cls} {
  box-shadow:
    0 -6px 16px -8px rgb(0 0 0 / 8%),
    0 -9px 28px 0 rgb(0 0 0 / 5%),
    0 -12px 48px 16px rgb(0 0 0 / 3%);
  transition: width 0.2s;
}
</style>
